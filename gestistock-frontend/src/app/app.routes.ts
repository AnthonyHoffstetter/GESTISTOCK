import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { CategoriesPage } from './pages/categories/categories.page';
import { ProductsPage } from './pages/products/products.page';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', component: LoginPage },

  {
    path: 'app',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'categories', component: CategoriesPage },
      { path: 'products', component: ProductsPage },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];