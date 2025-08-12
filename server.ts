// Local: server.ts

import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import express, { Request, Response } from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { baserowServer } from './src/shared/services/baserowServerClient.js';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

const app = express();
const port = 3001;

const upload = multer();

const corsOptions = {
  origin: '*'
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DAS IAs ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});


if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  console.error("ERRO CRÍTICO: As credenciais do Google não foram encontradas...");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const USERS_TABLE_ID = '711';
const VAGAS_TABLE_ID = '709';
const CANDIDATOS_TABLE_ID = '710';
const WHATSAPP_CANDIDATOS_TABLE_ID = '712';
const AGENDAMENTOS_TABLE_ID = '713';
const AVALIACOES_TABLE_ID = '727';
const RESULTADOS_TABLE_ID = '728';
const SALT_ROUNDS = 10;

interface BaserowJobPosting {
  id: number;
  titulo: string;
  usuario?: { id: number; value: string }[];
}

interface BaserowCandidate {
  id: number;
  vaga?: { id: number; value: string }[] | string | null;
  usuario?: { id: number; value: string }[] | null;
  nome: string;
  telefone: string | null;
  curriculo?: { url: string; name: string }[] | null;
  score?: number | null;
  resumo_ia?: string | null;
  status?: { id: number; value: 'Triagem' | 'Entrevista' | 'Aprovado' | 'Reprovado' } | null;
  data_triagem?: string;
  sexo?: string | null;
  escolaridade?: string | null;
  idade?: number | null;
  perfil_comportamental?: string | null;
}

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { nome, empresa, telefone, email, password } = req.body;
  if (!email || !password || !nome) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const emailLowerCase = email.toLowerCase();
    const { results: existingUsers } = await baserowServer.get(USERS_TABLE_ID, `?filter__Email__equal=${emailLowerCase}`);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await baserowServer.post(USERS_TABLE_ID, {
      nome,
      empresa,
      telefone,
      Email: emailLowerCase,
      senha_hash: hashedPassword,
    });

    const userProfile = {
      id: newUser.id,
      nome: newUser.nome,
      email: newUser.Email,
      empresa: newUser.empresa,
      telefone: newUser.telefone,
      avatar_url: newUser.avatar_url || null,
      google_refresh_token: newUser.google_refresh_token || null,
    };

    res.status(201).json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error('Erro no registro (backend):', error);
    res.status(500).json({ error: error.message || 'Erro ao criar conta.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const emailLowerCase = email.toLowerCase();
    const { results: users } = await baserowServer.get(USERS_TABLE_ID, `?filter__Email__equal=${emailLowerCase}`);
    const user = users && users[0];

    if (!user || !user.senha_hash) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.senha_hash);

    if (passwordMatches) {
      const userProfile = {
        id: user.id,
        nome: user.nome,
        email: user.Email,
        empresa: user.empresa,
        telefone: user.telefone,
        avatar_url: user.avatar_url || null,
        google_refresh_token: user.google_refresh_token || null,
      };
      res.json({ success: true, user: userProfile });
    } else {
      res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
  } catch (error: any) {
    console.error('Erro no login (backend):', error);
    res.status(500).json({ error: error.message || 'Erro ao fazer login.' });
  }
});

app.patch('/api/users/:userId/profile', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { nome, empresa, avatar_url } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
  }

  try {
    const updatedData: Record<string, any> = {};
    if (nome !== undefined) updatedData.nome = nome;
    if (empresa !== undefined) updatedData.empresa = empresa;
    if (avatar_url !== undefined) updatedData.avatar_url = avatar_url;

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
    }

    const updatedUser = await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), updatedData);

    const userProfile = {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.Email,
      empresa: updatedUser.empresa,
      telefone: updatedUser.telefone,
      avatar_url: updatedUser.avatar_url || null,
      google_refresh_token: updatedUser.google_refresh_token || null,
    };

    res.status(200).json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar o perfil.' });
  }
});

app.patch('/api/users/:userId/password', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'ID do usuário e nova senha são obrigatórios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), { senha_hash: hashedPassword });
    res.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao atualizar senha (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar a senha. Tente novamente.' });
  }
});

app.get('/api/users/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
  }
  try {
    const user = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const userProfile = {
      id: user.id,
      nome: user.nome,
      email: user.Email,
      empresa: user.empresa,
      telefone: user.telefone,
      avatar_url: user.avatar_url || null,
      google_refresh_token: user.google_refresh_token || null,
    };
    res.json(userProfile);
  } catch (error: any) {
    console.error('Erro ao buscar perfil do usuário (backend):', error);
    res.status(500).json({ error: 'Não foi possível buscar o perfil do usuário.' });
  }
});

app.post('/api/upload-avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  const userId = req.body.userId;
  if (!userId || !req.file) {
    return res.status(400).json({ error: 'Arquivo e ID do usuário são obrigatórios.' });
  }

  try {
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const mimetype = req.file.mimetype;

    const uploadedFile = await baserowServer.uploadFileFromBuffer(fileBuffer, fileName, mimetype);
    const newAvatarUrl = uploadedFile.url;

    const updatedUser = await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), { avatar_url: newAvatarUrl });

    const userProfile = {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.Email,
      empresa: updatedUser.empresa,
      telefone: updatedUser.telefone,
      avatar_url: updatedUser.avatar_url || null,
      google_refresh_token: updatedUser.google_refresh_token || null,
    };
    res.json({ success: true, avatar_url: newAvatarUrl, user: userProfile });

  } catch (error: any) {
    console.error('Erro ao fazer upload de avatar (backend):', error);
    res.status(500).json({ error: error.message || 'Não foi possível fazer upload do avatar.' });
  }
});

app.post('/api/jobs', async (req: Request, res: Response) => {
  const { titulo, descricao, endereco, requisitos_obrigatorios, requisitos_desejaveis, usuario } = req.body;
  if (!titulo || !descricao || !usuario || usuario.length === 0) {
    return res.status(400).json({ error: 'Título, descrição e ID do usuário são obrigatórios.' });
  }

  try {
    const createdJob = await baserowServer.post(VAGAS_TABLE_ID, {
      titulo,
      descricao,
      Endereco: endereco,
      requisitos_obrigatorios,
      requisitos_desejaveis,
      usuario,
    });
    res.status(201).json(createdJob);
  } catch (error: any) {
    console.error('Erro ao criar vaga (backend):', error);
    res.status(500).json({ error: 'Não foi possível criar a vaga.' });
  }
});

app.patch('/api/jobs/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const updatedData = req.body;
  if (!jobId || Object.keys(updatedData).length === 0) {
    return res.status(400).json({ error: 'ID da vaga e dados para atualização são obrigatórios.' });
  }

  try {
    const updatedJob = await baserowServer.patch(VAGAS_TABLE_ID, parseInt(jobId), updatedData);
    res.json(updatedJob);
  } catch (error: any) {
    console.error('Erro ao atualizar vaga (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar a vaga.' });
  }
});

app.delete('/api/jobs/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({ error: 'ID da vaga é obrigatório.' });
  }

  try {
    await baserowServer.delete(VAGAS_TABLE_ID, parseInt(jobId));
    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar vaga (backend):', error);
    res.status(500).json({ error: 'Não foi possível excluir a vaga.' });
  }
});

app.patch('/api/candidates/:candidateId/status', async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const { status } = req.body;

  if (!candidateId || !status) {
    return res.status(400).json({ error: 'ID do candidato e status são obrigatórios.' });
  }

  const validStatuses = ['Triagem', 'Entrevista', 'Aprovado', 'Reprovado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido fornecido.' });
  }

  try {
    const updatedCandidate = await baserowServer.patch(CANDIDATOS_TABLE_ID, parseInt(candidateId), { status: status });
    res.json(updatedCandidate);
  } catch (error: any) {
    console.error('Erro ao atualizar status do candidato (backend):', error);
    res.status(500).json({ error: 'Não foi possível atualizar o status do candidato.' });
  }
});

app.get('/api/data/all/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
  }

  try {
    const jobsResult = await baserowServer.get(VAGAS_TABLE_ID, '');
    const allJobs: BaserowJobPosting[] = (jobsResult.results || []) as BaserowJobPosting[];
    const userJobs = allJobs.filter((job) =>
      job.usuario && job.usuario.some((user) => user.id === parseInt(userId))
    );

    const userJobIds = new Set(userJobs.map(job => job.id));
    const jobsMapByTitle = new Map<string, BaserowJobPosting>(userJobs.map(job => [job.titulo.toLowerCase().trim(), job]));
    const jobsMapById = new Map<number, BaserowJobPosting>(userJobs.map(job => [job.id, job]));

    const regularCandidatesResult = await baserowServer.get(CANDIDATOS_TABLE_ID, '');
    const whatsappCandidatesResult = await baserowServer.get(WHATSAPP_CANDIDATOS_TABLE_ID, '');

    const allCandidatesRaw: BaserowCandidate[] = [
      ...(regularCandidatesResult.results || []),
      ...(whatsappCandidatesResult.results || [])
    ] as BaserowCandidate[];

    const userCandidatesRaw = allCandidatesRaw.filter((candidate) => {
      if (candidate.usuario && candidate.usuario.some((u) => u.id === parseInt(userId))) {
        return true;
      }
      if (typeof candidate.vaga === 'string' && candidate.vaga) {
        const jobMatch = jobsMapByTitle.get(candidate.vaga.toLowerCase().trim());
        return !!jobMatch;
      }
      if (candidate.vaga && Array.isArray(candidate.vaga) && candidate.vaga.length > 0) {
        const vagaId = (candidate.vaga[0] as { id: number; value: string }).id;
        return userJobIds.has(vagaId);
      }
      return false;
    });

    const syncedCandidates = userCandidatesRaw.map((candidate) => {
      const newCandidate = { ...candidate };
      let vagaLink: { id: number; value: string }[] | null = null;
      if (typeof candidate.vaga === 'string' && candidate.vaga) {
        const jobMatch = jobsMapByTitle.get(candidate.vaga.toLowerCase().trim());
        if (jobMatch) {
          vagaLink = [{ id: jobMatch.id, value: jobMatch.titulo }];
        }
      } else if (candidate.vaga && Array.isArray(candidate.vaga) && candidate.vaga.length > 0) {
        const linkedVaga = candidate.vaga[0] as { id: number; value: string };
        if (jobsMapById.has(linkedVaga.id)) {
          vagaLink = [{ id: linkedVaga.id, value: linkedVaga.value }];
        }
      }
      return { ...newCandidate, vaga: vagaLink };
    });

    res.json({ jobs: userJobs, candidates: syncedCandidates });

  } catch (error: any) {
    console.error('Erro ao buscar todos os dados (backend):', error);
    res.status(500).json({ error: 'Falha ao carregar dados.' });
  }
});

app.post('/api/upload-curriculums', upload.array('curriculumFiles'), async (req: Request, res: Response) => {
  const { jobId, userId } = req.body;
  const files = req.files as Express.Multer.File[];
  if (!jobId || !userId || !files || files.length === 0) {
    return res.status(400).json({ error: 'Vaga, usuário e arquivos de currículo são obrigatórios.' });
  }
  try {
    const newCandidateEntries = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: `O arquivo '${file.originalname}' é muito grande. O limite é de 5MB.` });
      }
      const uploadedFile = await baserowServer.uploadFileFromBuffer(file.buffer, file.originalname, file.mimetype);
      const newCandidateData = {
        nome: file.originalname.split('.')[0] || 'Novo Candidato',
        curriculo: [{ name: uploadedFile.name, url: uploadedFile.url }],
        usuario: [parseInt(userId as string)],
        vaga: [parseInt(jobId as string)],
        score: null,
        resumo_ia: null,
        status: 'Triagem',
      };
      const createdCandidate = await baserowServer.post(CANDIDATOS_TABLE_ID, newCandidateData);
      newCandidateEntries.push(createdCandidate);
    }
    res.json({ success: true, message: `${files.length} currículo(s) enviado(s) para análise!`, newCandidates: newCandidateEntries });
  } catch (error: any) {
    console.error('Erro no upload de currículos (backend):', error);
    res.status(500).json({ success: false, message: error.message || 'Falha ao fazer upload dos currículos.' });
  }
});

app.get('/api/schedules/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
  }
  try {
    const { results } = await baserowServer.get(AGENDAMENTOS_TABLE_ID, `?filter__Candidato__usuario__link_row_has=${userId}`);
    res.json({ success: true, results: results || [] });
  } catch (error: any) {
    console.error('Erro ao buscar agendamentos (backend):', error);
    res.status(500).json({ success: false, message: 'Falha ao buscar agendamentos.' });
  }
});

app.get('/api/google/auth/connect', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent', state: userId.toString() });
  res.json({ url });
});

app.get('/api/google/auth/callback', async (req: Request, res: Response) => {
  const { code, state: userId } = req.query;
  const closePopupScript = `<script>window.close();</script>`;
  if (!code || !userId) return res.send(closePopupScript);
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    const { refresh_token } = tokens;
    if (refresh_token) {
      await baserowServer.patch(USERS_TABLE_ID, parseInt(userId as string), { google_refresh_token: refresh_token });
    }
    oauth2Client.setCredentials(tokens);
    res.send(closePopupScript);
  } catch (error: any) {
    console.error('[Google Auth Callback] ERRO DETALHADO:', error.response?.data || error.message);
    res.status(500).send(`<html><body><h1>Erro na Autenticação</h1></body></html>`);
  }
});

app.post('/api/google/auth/disconnect', async (req: Request, res: Response) => {
  const { userId } = req.body;
  await baserowServer.patch(USERS_TABLE_ID, parseInt(userId), { google_refresh_token: null });
  res.json({ success: true, message: 'Conta Google desconectada.' });
});

app.get('/api/google/auth/status', async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
  try {
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId as string));
    const isConnected = !!userResponse.google_refresh_token;
    res.json({ isConnected });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status da conexão.' });
  }
});

app.post('/api/google/calendar/create-event', async (req: Request, res: Response) => {
  const { userId, eventData, candidate, job } = req.body;
  if (!userId || !eventData || !candidate || !job) {
    return res.status(400).json({ success: false, message: 'Dados insuficientes.' });
  }
  try {
    const userResponse = await baserowServer.getRow(USERS_TABLE_ID, parseInt(userId));
    const refreshToken = userResponse.google_refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Usuário não conectado ao Google Calendar.' });
    }
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const eventDescription = `Entrevista com o candidato: ${candidate.nome}.\nTelefone: ${candidate.telefone || 'Não informado'}\n\n--- Detalhes ---\n${eventData.details || 'Nenhum.'}`;
    const event = {
      summary: eventData.title, description: eventDescription,
      start: { dateTime: eventData.start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: eventData.end, timeZone: 'America/Sao_Paulo' },
      reminders: { useDefault: true },
    };
    const response = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
    await baserowServer.post(AGENDAMENTOS_TABLE_ID, {
      'Título': eventData.title, 'Início': eventData.start, 'Fim': eventData.end,
      'Detalhes': eventData.details, 'Candidato': [candidate.id], 'Vaga': [job.id], 'google_event_link': response.data.htmlLink
    });
    res.json({ success: true, message: 'Evento criado com sucesso!', data: response.data });
  } catch (error) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    res.status(500).json({ success: false, message: 'Falha ao criar evento.' });
  }
});

// --- NOVA FEATURE: PERFIL COMPORTAMENTAL ---

const adjetivos = [
  'Alegre', 'Animado', 'Anti-Social', 'Arrogante', 'Ativo', 'Bem-Quisto', 'Bom Companheiro', 'Calculista', 'Calmo', 'Compreensivo',
  'Cumpridor', 'Decidido', 'Dedicado', 'Depressivo', 'Desconfiado', 'Egocêntrico', 'Egoísta', 'Empolgante', 'Enérgico', 'Entusiasta',
  'Estrovertido', 'Exuberante', 'Firme', 'Frio', 'Habilidoso', 'Inflexível', 'Influenciador', 'Ingênuo', 'Inseguro', 'Insensível',
  'Audacioso (Ousado)', 'Auto-Disciplinado', 'Auto-Suficiente', 'Barulhento', 'Bem-Humorado', 'Comunicativo', 'Conservador', 'Contagiante', 'Corajoso',
  'Crítico', 'Desmotivado', 'Desorganizado', 'Destacado', 'Discreto', 'Eficiente', 'Equilibrado', 'Espalhafatoso', 'Estimulante', 'Exagerado', 'Exigente',
  'Idealista', 'Impaciente', 'Indeciso', 'Independente', 'Indisciplinado', 'Intolerante', 'Introvertido', 'Leal', 'Líder', 'Medroso',
  'Minucioso', 'Modesto', 'Orgulhoso', 'Otimista', 'Paciente', 'Perfeccionista', 'Persistente', 'Pessimista', 'Popular', 'Prático',
  'Pretensioso', 'Procrastinator', 'Racional', 'Reservado', 'Resoluto (Decidido)', 'Rotineiro', 'Sarcástico', 'Sensível', 'Sentimental', 'Simpático',
  'Sincero', 'Temeroso', 'Teórico', 'Tranquilo', 'Vaidoso', 'Vingativo'
];
const perfilMap: { [key: string]: string } = {
    'Audacioso (Ousado)': 'E', 'Líder': 'E', 'Exigente': 'E', 'Decidido': 'E', 'Independente': 'E', 'Corajoso': 'E', 'Firme': 'E', 'Ativo': 'E', 'Enérgico': 'E',
    'Comunicativo': 'C', 'Popular': 'C', 'Entusiasta': 'C', 'Otimista': 'C', 'Contagiante': 'C', 'Influenciador': 'C', 'Alegre': 'C', 'Animado': 'C', 'Simpático': 'C',
    'Calmo': 'P', 'Paciente': 'P', 'Leal': 'P', 'Tranquilo': 'P', 'Conservador': 'P', 'Dedicado': 'P', 'Compreensivo': 'P', 'Bom Companheiro': 'P', 'Modesto': 'P',
    'Perfeccionista': 'A', 'Minucioso': 'A', 'Racional': 'A', 'Calculista': 'A', 'Crítico': 'A', 'Prático': 'A', 'Auto-Disciplinado': 'A', 'Eficiente': 'A', 'Cumpridor': 'A'
};

app.post('/api/candidates/:candidateId/create-assessment', async (req: Request, res: Response) => {
    const { candidateId } = req.params;
    try {
        const token = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + 30);
        const newAssessment = await baserowServer.post(AVALIACOES_TABLE_ID, {
            candidato: [parseInt(candidateId)], token: token, status: 'Pendente', expira_em: expiraEm.toISOString().split('T')[0]
        });
        const assessmentLink = `https://recrutamentoia.com.br/assessment/${token}`;
        res.status(201).json({ success: true, link: assessmentLink, assessmentId: newAssessment.id });
    } catch (error: any) {
        res.status(500).json({ error: 'Não foi possível criar o link da avaliação.' });
    }
});

app.get('/api/assessment/:token', async (req: Request, res: Response) => {
    const { token } = req.params;
    try {
        const { results } = await baserowServer.get(AVALIACOES_TABLE_ID, `?filter__token__equal=${token}`);
        const assessment = results && results[0];
        if (!assessment || assessment.status === 'Concluído') {
            return res.status(404).json({ error: 'Avaliação não encontrada, já respondida ou expirada.' });
        }
        res.json({ success: true, assessmentId: assessment.id, adjectives: adjetivos });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados da avaliação.' });
    }
});

app.post('/api/assessment/:assessmentId/submit', async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const { passo1, passo2, passo3 } = req.body;

    try {
        const scores: { [key: string]: number } = { E: 0, C: 0, P: 0, A: 0 };
        const allSelected = [...(passo1 || []), ...(passo2 || []), ...(passo3 || [])];
        allSelected.forEach(adjetivo => {
            const perfil = perfilMap[adjetivo];
            if (perfil) { scores[perfil] = (scores[perfil] || 0) + 1; }
        });

        const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
        const finalScores = {
            executor: total > 0 ? parseFloat(((scores.E / total) * 100).toFixed(2)) : 0,
            comunicador: total > 0 ? parseFloat(((scores.C / total) * 100).toFixed(2)) : 0,
            planejador: total > 0 ? parseFloat(((scores.P / total) * 100).toFixed(2)) : 0,
            analista: total > 0 ? parseFloat(((scores.A / total) * 100).toFixed(2)) : 0,
        };
        
        let analiseIA = null;
        
        const prompt = `
# INSTRUÇÃO
Responda APENAS com o objeto JSON solicitado, sem nenhum texto adicional, introduções ou explicações.

# PERSONA
Você é um Analista Comportamental Sênior, especialista certificado na metodologia DISC, com foco em psicologia organizacional. Sua análise é profunda, contextualizada para o ambiente de trabalho e utiliza uma linguagem positiva e construtiva.

# OBJETIVO
Analisar os dados de um perfil DISC para gerar um relatório completo, identificando o perfil predominante, subcaracterísticas, pontos fortes, pontos de atenção e indicadores situacionais.

# DADOS DE ENTRADA
- **Scores Percentuais:**
    - Executor (Dominância): ${finalScores.executor}%
    - Comunicador (Influência): ${finalScores.comunicador}%
    - Planejador (Estabilidade): ${finalScores.planejador}%
    - Analista (Conformidade): ${finalScores.analista}%
- **Adjetivos Selecionados:** ${JSON.stringify(allSelected)}

# PROCESSAMENTO
1.  **Perfis:** Identifique o perfil principal (maior score) e o secundário (segundo maior score).
2.  **Resumo:** Crie um parágrafo que combine as características do perfil principal e secundário, usando os adjetivos selecionados para dar mais cor e especificidade à descrição.
3.  **Subcaracterísticas:** Com base no perfil principal, liste de 3 a 5 palavras-chave que definem as qualidades centrais desse perfil (ex: Executor -> Foco em Resultados, Determinação, Competitividade).
4.  **Indicadores Situacionais:** Avalie três aspectos com base nos scores. Use os níveis "Baixo", "Normal", "Alto" ou "Muito Alto".
    * **Exigência do Meio:** Quão pressionado o indivíduo se sente. Alto Executor e/ou Analista pode indicar alta auto-cobrança.
    * **Aproveitamento:** Quão bem o indivíduo utiliza suas habilidades naturais. Scores equilibrados ou um score muito dominante podem indicar alto aproveitamento.
    * **Autoconfiança:** Nível de segurança em suas ações. Alto Executor e/ou Comunicador geralmente reflete alta autoconfiança.

# ESTRUTURA DE SAÍDA (JSON OBRIGATÓRIA)
\`\`\`json
{
  "perfil_principal": "O nome do perfil com a maior pontuação (Executor, Comunicador, Planejador ou Analista)",
  "perfil_secundario": "O nome do perfil com a segunda maior pontuação",
  "resumo_comportamental": "Um parágrafo detalhado que descreve o estilo de trabalho da pessoa, combinando o perfil principal e secundário e usando os adjetivos selecionados.",
  "subcaracteristicas": [
    "Palavra-chave 1",
    "Palavra-chave 2",
    "Palavra-chave 3"
  ],
  "pontos_fortes_contextuais": [
    "Ponto forte 1, explicado de forma clara e relacionado ao contexto de trabalho.",
    "Ponto forte 2, explicado de forma clara e relacionado ao contexto de trabalho."
  ],
  "pontos_de_atencao": [
    "Ponto a desenvolver 1, descrito de forma construtiva e prática.",
    "Ponto a desenvolver 2, descrito de forma construtiva e prática."
  ],
  "indicadores_situacionais": {
      "exigencia_meio": "O nível avaliado (Baixo, Normal, Alto, Muito Alto)",
      "aproveitamento": "O nível avaliado (Baixo, Normal, Alto, Muito Alto)",
      "autoconfianca": "O nível avaliado (Baixo, Normal, Alto, Muito Alto)"
  }
}
\`\`\`
`;
        try {
            console.log("Tentando chamada para OpenAI...");
            const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.1, response_format: { type: "json_object" } });
            if (completion.choices[0].message.content) {
                analiseIA = completion.choices[0].message.content;
            }
        } catch (aiError) {
            console.error("Erro na chamada para a OpenAI, tentando fallback para Groq:", aiError);
            try {
                console.log("Tentando chamada para Groq...");
                const completion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama3-8b-8192',
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                });
                if (completion.choices[0].message.content) {
                    analiseIA = completion.choices[0].message.content;
                }
            } catch (groqError) {
                console.error("Erro na chamada para o Groq:", groqError);
            }
        }
        
        await baserowServer.post(RESULTADOS_TABLE_ID, {
            avaliacao: [parseInt(assessmentId)], ...finalScores,
            respostas_passo1: JSON.stringify(passo1), respostas_passo2: JSON.stringify(passo2), respostas_passo3: JSON.stringify(passo3),
            analise_ia: analiseIA
        });

        const assessmentData = await baserowServer.getRow(AVALIACOES_TABLE_ID, parseInt(assessmentId));
        if (assessmentData && assessmentData.candidato && assessmentData.candidato.length > 0) {
            const candidateId = assessmentData.candidato[0].id;
            let perfilPrincipal = null;
            if (analiseIA) {
                try {
                    const parsedAnalise = JSON.parse(analiseIA);
                    perfilPrincipal = parsedAnalise.perfil_principal;
                } catch (e) {
                    console.error("Não foi possível parsear a análise da IA para extrair o perfil principal.");
                }
            }
            if (perfilPrincipal && candidateId) {
                console.log(`Atualizando candidato ${candidateId} com perfil: ${perfilPrincipal}`);
                await baserowServer.patch(CANDIDATOS_TABLE_ID, candidateId, {
                    perfil_comportamental: perfilPrincipal
                });
            }
        }

        await baserowServer.patch(AVALIACOES_TABLE_ID, parseInt(assessmentId), { status: 'Concluído' });
        
        res.status(200).json({ success: true, message: "Avaliação concluída com sucesso!" });

    } catch (error) {
        console.error("Erro ao submeter avaliação (falha ao salvar no banco):", error);
        res.status(500).json({ error: 'Não foi possível processar sua avaliação.' });
    }
});

app.get('/api/assessment/result/:assessmentId', async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    try {
        const { results } = await baserowServer.get(RESULTADOS_TABLE_ID, `?filter__avaliacao__link_row_has=${assessmentId}`);
        if (results && results.length > 0) {
            const profileData = results[0];
            res.json({ success: true, result: profileData });
        } else {
            res.status(404).json({ error: "Resultado da avaliação não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar resultado da avaliação." });
    }
});

app.get('/api/candidates/:candidateId/behavioral-profile', async (req: Request, res: Response) => {
    const { candidateId } = req.params;
    if (!candidateId) { return res.status(400).json({ error: 'ID do candidato é obrigatório.' }); }
    try {
        const { results: avaliacoes } = await baserowServer.get(AVALIACOES_TABLE_ID, `?filter__candidato__link_row_has=${candidateId}`);
        if (!avaliacoes || avaliacoes.length === 0) { return res.json({ success: true, profile: null }); }
        const avaliacaoId = avaliacoes[0].id;
        const { results: resultados } = await baserowServer.get(RESULTADOS_TABLE_ID, `?filter__avaliacao__link_row_has=${avaliacaoId}`);
        if (resultados && resultados.length > 0) {
            res.json({ success: true, profile: resultados[0] });
        } else {
            res.json({ success: true, profile: null });
        }
    } catch (error: any) {
        console.error('Erro ao buscar perfil comportamental:', error);
        res.status(500).json({ error: 'Não foi possível buscar o perfil comportamental.' });
    }
});

app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});