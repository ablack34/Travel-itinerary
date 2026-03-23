export interface Itinerary {
  title: string;
  startDate: string;
  travelers: string[];
  days: Day[];
  todos: TodoItem[];
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  assignee: string;
}

export interface Day {
  id: string;
  country: 'peru' | 'bolivia' | 'chile' | 'travel' | 'home';
  location: string;
  activities: Activity[];
  links: Link[];
}

export interface Activity {
  id: string;
  text: string;
  isHighlight: boolean;
}

export interface Link {
  id: string;
  label: string;
  url: string;
  type: 'accommodation' | 'tour' | 'transport' | 'restaurant' | 'other';
}
