import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspDetailNavComponent } from './insp-detail-nav.component';

xdescribe('DetailNavComponent', () => {
  let component: InspDetailNavComponent;
  let fixture: ComponentFixture<InspDetailNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InspDetailNavComponent]
    });
    fixture = TestBed.createComponent(InspDetailNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
