import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TmlDetailMeridiumComponent } from './tml-detail-meridium.component';

describe('TmlDetailMeridiumComponent', () => {
  let component: TmlDetailMeridiumComponent;
  let fixture: ComponentFixture<TmlDetailMeridiumComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TmlDetailMeridiumComponent]
    });
    fixture = TestBed.createComponent(TmlDetailMeridiumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
