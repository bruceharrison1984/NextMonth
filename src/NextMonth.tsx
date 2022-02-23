import {
  CalendarEvent,
  DateTimeAdapter,
  NextMonthComponents,
} from '@/types/index';
import { CalendarProvider, ComponentProvider } from '@/providers/index';
import { DayOfWeekLayout, HeaderLayout, MonthLayout } from '@/layouts/index';
import { Theme, defaultTheme, makeCssTheme } from '@/theme/index';
import { createDefaultConvertor } from './dateConvertors';
import { useMemo } from 'react';

export interface NextMonthProps {
  dateAdapter?: DateTimeAdapter;
  nextMonthComponents?: Partial<NextMonthComponents>;
  events: CalendarEvent[];
  theme?: Partial<Theme>;
  className?: string;
}

export const NextMonth = ({
  dateAdapter = createDefaultConvertor(),
  nextMonthComponents,
  events,
  theme,
  className = 'nextmonth',
}: NextMonthProps) => {
  if (!dateAdapter) throw new Error('Date Convertor must be supplied!');

  const cssTheme = useMemo(
    () => makeCssTheme(theme || defaultTheme, 'nextmonth'),
    [theme]
  );

  return (
    <div className={className} style={cssTheme}>
      <ComponentProvider calendarComponents={nextMonthComponents}>
        <CalendarProvider dateAdapter={dateAdapter} calendarEvents={events}>
          <HeaderLayout />
          <DayOfWeekLayout />
          <MonthLayout />
        </CalendarProvider>
      </ComponentProvider>
    </div>
  );
};
