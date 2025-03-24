import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreareChestionarComponent } from './creare-chestionar.component';

describe('CreareChestionarComponent', () => {
  let component: CreareChestionarComponent;
  let fixture: ComponentFixture<CreareChestionarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreareChestionarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreareChestionarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
