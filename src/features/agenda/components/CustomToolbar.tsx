// Local: src/features/agenda/components/CustomToolbar.tsx

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { View } from 'react-big-calendar';

interface CustomToolbarProps {
  label: string;
  view: View;
  views: View[];
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', date?: Date) => void;
  onView: (view: View) => void;
}

const CustomToolbar: React.FC<CustomToolbarProps> = ({ onNavigate, onView, label, view }) => {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-t-lg border-b">
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={() => onNavigate('TODAY')}>Hoje</Button>
        <Button variant="ghost" size="icon" onClick={() => onNavigate('PREV')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onNavigate('NEXT')}>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <span className="text-xl font-semibold text-gray-700">
          {format(new Date(label), 'MMMM yyyy', { locale: ptBR })}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {(['month', 'week', 'day'] as View[]).map(viewName => (
          <Button
            key={viewName}
            variant={view === viewName ? 'default' : 'outline'}
            onClick={() => onView(viewName)}
          >
            {capitalize(viewName === 'month' ? 'Mês' : viewName === 'week' ? 'Semana' : 'Dia')}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CustomToolbar;