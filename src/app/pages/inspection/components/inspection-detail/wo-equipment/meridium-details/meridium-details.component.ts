import { Component, Input, OnDestroy } from '@angular/core';
import { MeridiumDetails } from 'src/app/core/sync/entities';

@Component({
  selector: 'app-meridium-details',
  templateUrl: './meridium-details.component.html',
  styleUrls: ['./meridium-details.component.scss']
})
export class MeridiumDetailsComponent implements OnDestroy {
  @Input() meridiumDetails: MeridiumDetails;

  ngOnDestroy(): void {
    this.meridiumDetails = null;
  }
}
