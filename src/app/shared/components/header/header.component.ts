import { Component, input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-header',
  imports: [AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    class: 'ch-header',
  },
})
export class HeaderComponent {
  sectionLabel = input('');
  pageTitle = input('');
  showNotificationDot = input(false);
  userInitials = input('');

  notificationClicked = output<void>();
  profileClicked = output<void>();
}
