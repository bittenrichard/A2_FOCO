// Local: src/features/agenda/types/index.ts

import { JobPosting } from "../../screening/types";
import { Candidate } from "../../../shared/types";

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  details?: string;
  candidate: Candidate;
  job: JobPosting;
  google_event_link?: string;
}