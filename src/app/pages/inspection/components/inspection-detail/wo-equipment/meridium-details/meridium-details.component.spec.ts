import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeridiumDetailsComponent } from './meridium-details.component';

describe('MeridiumDetailsComponent', () => {
  let component: MeridiumDetailsComponent;
  let fixture: ComponentFixture<MeridiumDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MeridiumDetailsComponent]
    });
    fixture = TestBed.createComponent(MeridiumDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
