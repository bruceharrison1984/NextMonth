import {
  EventIntersectionState,
  InternalCalendarEvent,
  InternalEventWeek,
} from '@/types';
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useCalendar } from '@/hooks';

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
  eventsInWeek,
}: {
  children: ReactNode;
  eventsInWeek: InternalCalendarEvent[];
}) => {
  const {
    dateAdapter: { isDateBetween },
  } = useCalendar();

  const [parentContainerRef, setParentContainerRef] =
    useState<HTMLElement | null>(null);

  const observerRef = useRef<IntersectionObserver | undefined>();

  const [eventVisibility, setEventVisibility] = useState<
    Record<string, InternalCalendarEvent>
  >(Object.assign({}, ...eventsInWeek.map((x) => ({ [x.id]: x }))));

  const getEventsOnDate = useCallback(
    (date: Date) =>
      Object.values(eventVisibility).filter((x) =>
        isDateBetween(date, x.start, x.end)
      ),
    [eventVisibility, isDateBetween]
  );

  /**
   * This method checks if an event is fully visible, and if not hides it
   * We do this via direct Refs because direct updates are faster and cleaner than relying upon
   * React to route the property before and after a render.
   *
   * This could possibly be done in a more React-y way by splitting this context, but this seems pretty straight-forward as it.
   */
  const checkIntersection: IntersectionObserverCallback = useCallback(
    (entries) =>
      entries.map((x) => {
        const currentStyle =
          x.target
            .getAttribute('style')
            ?.split(';')
            .filter((x) => x && !x.includes('visibility')) || [];

        if (x.isIntersecting)
          x.target.setAttribute('style', currentStyle.join(';'));
        else {
          currentStyle.push('visibility: hidden');
          x.target.setAttribute('style', currentStyle.join(';'));
        }

        // this controls the event data that is sent back to the DayComponent for event visibility
        setEventVisibility((current) => {
          var eventId = x.target.attributes.getNamedItem('data-eventid')?.value;
          if (!eventId) return { ...current };

          if (!current[eventId]) {
            const matchingEvent = eventsInWeek.find((x) => x.id === eventId)!;
            current[eventId] = matchingEvent;
          }
          current[eventId].visible = x.isIntersecting;
          return { ...current };
        });
      }),
    [eventsInWeek]
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(checkIntersection, {
      root: parentContainerRef,
      rootMargin: '0px 0px -15% 0px',
      threshold: 1,
    });

    const eventContainers = parentContainerRef?.getElementsByClassName(
      'event-position-layout'
    );

    if (eventContainers)
      for (const element of Array.from(eventContainers))
        observerRef.current!.observe(element);

    return () => {
      observerRef.current!.disconnect();
    };
  }, [checkIntersection, parentContainerRef]);

  const value: EventIntersectionState = {
    setParentContainerRef,
    getEventsOnDate,
  };

  return (
    <EventIntersectionContext.Provider value={value}>
      {children}
    </EventIntersectionContext.Provider>
  );
};
