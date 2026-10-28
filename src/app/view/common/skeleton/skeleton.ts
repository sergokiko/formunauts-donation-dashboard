import { Component, input } from '@angular/core';

/** Shimmering placeholder block shown while data loads. Hidden from assistive tech. */
@Component({
  selector: 'app-skeleton',
  template: '',
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()'
  },
  styleUrl: './skeleton.scss'
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('1rem');
}
