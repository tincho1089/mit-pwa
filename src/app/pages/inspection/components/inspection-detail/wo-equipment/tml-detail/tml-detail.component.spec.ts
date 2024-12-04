import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TmlDetailComponent } from './tml-detail.component';

describe('TmlDetailComponent', () => {
  let component: TmlDetailComponent;
  let fixture: ComponentFixture<TmlDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TmlDetailComponent]
    });
    fixture = TestBed.createComponent(TmlDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
