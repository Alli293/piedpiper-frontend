import { Component, input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  imports: [AvatarComponent, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    class: 'ch-header',
    role: 'banner',
  },
})
export class HeaderComponent {
  sectionLabel = input('');
  pageTitle = input('');
  userInitials = input('');
  showBackButton = input(false);

  profileClicked = output<void>();
  backClicked = output<void>();
}
