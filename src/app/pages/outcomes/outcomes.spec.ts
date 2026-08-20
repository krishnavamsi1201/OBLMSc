import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Outcomes } from './outcomes';

describe('Outcomes', () => {
  let component: Outcomes;
  let fixture: ComponentFixture<Outcomes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, Outcomes],
    }).compileComponents();

    fixture = TestBed.createComponent(Outcomes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
