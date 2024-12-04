import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TmlDetailModalComponent } from './tml-detail-modal.component';

describe('TmlDetailModalComponent', () => {
  let component: TmlDetailModalComponent;
  let fixture: ComponentFixture<TmlDetailModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TmlDetailModalComponent]
    });
    fixture = TestBed.createComponent(TmlDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
