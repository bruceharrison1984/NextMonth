import { EventIntersectionState, InternalCalendarEvent } from '@/types';
import { ReactNode, createContext, useEffect, useState } from 'react';
import { useCalendar } from '@/hooks/useCalendar';

export const EventIntersectionContext =
  createContext<EventIntersectionState | null>(null);
EventIntersectionContext.displayName = 'EventIntersectionContext';

/**
 * Determines which events overflow from the calendar, and when they should be hidden
 * @param {ReactNode} children Child nodes
 * @param {InternalCalendarEvent[]} events Calendar Events assoicated with this parent
 * @returns EventIntersectionProvider component
 */
export const EventIntersectionProvider = ({
  children,
  events,
}: {
  children: ReactNode;
  events: InternalCalendarEvent[];
}) => {
  const {
    dateAdapter: { isDateBetween },
  } = useCalendar();

  const [childContainerRefs, setChildContainerRefs] = useState<
    Record<string, HTMLElement | null>
  >({});

  const [parentContainerRef, setParentContainerRef] =
    useState<HTMLElement | null>(null);

  const [eventVisibility, setEventVisibility] = useState<
    Record<string, InternalCalendarEvent>
  >({});

  const setRefFromKey = (key: string) => (element: HTMLElement | null) =>
    setChildContainerRefs((current) => {
      current[key] = element;
      return current;
    });

  const getEventsOnDate = (date: Date) =>
    Object.values(eventVisibility).filter((x) =>
      isDateBetween(date, x.start, x.end)
    );

  const isEventVisible = (key: string) => eventVisibility[key]?.visible;

  const checkIntersection: IntersectionObserverCallback = (entries) =>
    entries.map((x) => {
      var eventId = x.target.attributes.getNamedItem('data-eventid')?.value;
      const matchingEvent = events.find((x) => x.id === eventId);
      if (matchingEvent === undefined) return;

      setEventVisibility((current) => {
        current[matchingEvent.id] = matchingEvent;
        current[matchingEvent.id].visible = x.intersectionRatio >= 1;
        return { ...current };
      });
    });

  useEffect(() => {
    const observer = new IntersectionObserver(checkIntersection, {
      root: parentContainerRef,
      rootMargin: '0px 0px -15% 0px',
      threshold: 1,
    });

    Object.values(childContainerRefs).map((eventRef) => {
      if (eventRef) observer.observe(eventRef!);
    });

    return () => {
      observer.takeRecords().map((x) => observer.unobserve(x.target));
      observer.disconnect();
    };
  }, [parentContainerRef, events]);

  const value: EventIntersectionState = {
    setParentContainerRef,
    setRefFromKey,
    isEventVisible,
    getEventsOnDate,
  };

  return (
    <EventIntersectionContext.Provider value={value}>
      {children}
    </EventIntersectionContext.Provider>
  );
};
