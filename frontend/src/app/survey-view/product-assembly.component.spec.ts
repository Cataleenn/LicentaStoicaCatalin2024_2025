import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductAssemblyComponent } from './product-assembly.component';

describe('ProductAssemblyComponent', () => {
  let component: ProductAssemblyComponent;
  let fixture: ComponentFixture<ProductAssemblyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAssemblyComponent] 
    }).compileComponents();

    fixture = TestBed.createComponent(ProductAssemblyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
