import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { CategoriesPage } from './pages/categories/categories.page';
import { ProductsPage } from './pages/products/products.page';
import { StockInPage } from './pages/stock-in/stock-in.page';
import { StockInDetailPage } from './pages/stock-in-detail/stock-in-detail.page';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { FournisseursPage } from './pages/fournisseurs/fournisseurs.page';
import { UtilisateursPage } from './pages/utilisateurs/utilisateurs.page';

export const routes: Routes = [
  { path: '', component: LoginPage },

  {
    path: 'app',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'categories', component: CategoriesPage },
      { path: 'products', component: ProductsPage },
      { path: 'stock-in', component: StockInPage },
      { path: 'stock-in/:id', component: StockInDetailPage },
      { path: 'fournisseurs', component: FournisseursPage },
      { path: 'users', component: UtilisateursPage },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
