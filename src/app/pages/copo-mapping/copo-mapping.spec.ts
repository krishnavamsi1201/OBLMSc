import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CopoMapping } from './copo-mapping';

describe('CopoMapping', () => {
  let component: CopoMapping;
  let fixture: ComponentFixture<CopoMapping>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, CopoMapping],
    }).compileComponents();

    fixture = TestBed.createComponent(CopoMapping);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
