import { Injectable } from '@angular/core';
import { Subject, Observable, filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private eventSubject = new Subject<any>();

  publishEvent(eventName: string, data: any) {
    this.eventSubject.next({ name: eventName, data });
  }

  getEvent(eventName: string): Observable<any> {
    return this.eventSubject.asObservable().pipe(
      filter((event) => event.name === eventName),
      map((event) => event.data)
    );
  }
}
