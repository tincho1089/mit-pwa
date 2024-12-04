import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { HomeComponent } from './components/home/home.component';
import { InspectionListItem } from './components/inspection-list-item/inspection-list-item.component';
import { OnlineSearchInspectionList } from './components/online-search-inspection-list/online-search-inspection-list.component'
import { HomeRoutingModule } from './home.routing.module';
import { NgxScannerQrcodeModule } from 'ngx-scanner-qrcode';
import { TranslateModule } from '@ngx-translate/core';
import { OnlineSearchInspectionListItem } from './components/online-search-inspection-list-item/online-search-inspection-list-item.component';
@NgModule({
  declarations: [HomeComponent,InspectionListItem,OnlineSearchInspectionList, OnlineSearchInspectionListItem],
  imports: [CommonModule, HomeRoutingModule, SharedModule, NgxScannerQrcodeModule, TranslateModule],
})
export class HomeModule { }
