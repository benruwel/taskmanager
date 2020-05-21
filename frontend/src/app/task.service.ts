import { Injectable } from '@angular/core';
import { WebrequestService } from './webrequest.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private webRequestService: WebrequestService) { }

  createList(title: string){
    //sends a web req to create a list
    return this.webRequestService.post('lists', { title })
  }

  getList(){
    return this.webRequestService.get('lists');
  }

  getTasks(listId : string){
    return this.webRequestService.get(`lists/${listId}/tasks`)
  }

}
