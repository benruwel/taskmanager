import { Injectable } from '@angular/core';
import { WebrequestService } from './webrequest.service';
import { Task } from './models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private webRequestService: WebrequestService) { }

  
  
  getList(){
    return this.webRequestService.get('lists');
  }
  
  createList(title: string){
    //sends a web req to create a list
    return this.webRequestService.post('lists', { title })
  }
  
  createTask(title: string, listId : string){
    //sends a web req to create a task
    return this.webRequestService.post(`lists/${listId}/tasks`, { title })
  }
  getTasks(listId : string){
    return this.webRequestService.get(`lists/${listId}/tasks`)
  }

  complete(task : Task){
    return this.webRequestService.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completed : !task.completed
    })
  }
}
