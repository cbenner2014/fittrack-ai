import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GimnasiosPageRoutingModule } from './gimnasios-routing.module';

import { GimnasiosPage } from './gimnasios.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GimnasiosPageRoutingModule
  ],
  declarations: [GimnasiosPage]
})
export class GimnasiosPageModule {}
