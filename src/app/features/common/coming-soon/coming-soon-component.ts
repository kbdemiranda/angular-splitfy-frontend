import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon-component.html',
  styleUrl: './coming-soon-component.scss',
  standalone: false,
})
export class ComingSoonComponent {
  readonly title: string;

  constructor(private readonly route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] ?? 'Módulo';
  }
}
