import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppHeader } from '../../shell/app-header/app-header';

@Component({
  selector: 'app-not-found-page',
  imports: [AppHeader, RouterLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss'
})
export class NotFoundPage {}
