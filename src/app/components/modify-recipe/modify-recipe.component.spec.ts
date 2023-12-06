import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyRecipeComponent } from './modify-recipe.component';

describe('ModifyRecipeComponent', () => {
  let component: ModifyRecipeComponent;
  let fixture: ComponentFixture<ModifyRecipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifyRecipeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModifyRecipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
