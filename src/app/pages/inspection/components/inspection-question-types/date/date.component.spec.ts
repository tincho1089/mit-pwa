import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateComponent } from './date.component';

xdescribe('DateComponent', () => {
  let component: DateComponent;
  let fixture: ComponentFixture<DateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
