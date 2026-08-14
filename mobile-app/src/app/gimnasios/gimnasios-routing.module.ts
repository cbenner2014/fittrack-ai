import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GimnasiosPage } from './gimnasios.page';

const routes: Routes = [
  {
    path: '',
    component: GimnasiosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GimnasiosPageRoutingModule {}
