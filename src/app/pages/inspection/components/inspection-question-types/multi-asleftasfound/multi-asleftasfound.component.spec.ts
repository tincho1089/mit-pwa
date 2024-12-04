import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiAsleftasfoundComponent } from './multi-asleftasfound.component';

xdescribe('MultiAsleftasfoundComponent', () => {
  let component: MultiAsleftasfoundComponent;
  let fixture: ComponentFixture<MultiAsleftasfoundComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultiAsleftasfoundComponent]
    });
    fixture = TestBed.createComponent(MultiAsleftasfoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
