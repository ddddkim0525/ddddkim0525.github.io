const REPEAT = {
    NONE: "none",
    ONE: "one",
    All: "all"
}
//TODO: When changed value on current play, change number when paused.
/*
*   Timer Object. Time and Durations are all measured in seconds.
*/
class Timer {
    constructor (item,taskList){
        this.name = item.name;
        this.duration = item.duration;
        this.time = item.duration;
        this.timerCall = 0;
        this.taskList = taskList;
        this.flush();
    }
    set(item){
        //console.log(item,this);
        if(item != null){
            this.name = item.name;
            this.duration = item.duration;
            this.time = item.duration;
        }
        else{
            clearInterval(this.timerCall);
            this.timerCall = 0; 
        }
        this.flush();
    }
    update() {}

    formatTime(time){
        let sec = time % 60;
        if(sec <= 9) sec = '0' + sec;
        const min = Math.floor(time/60);
        return min + ':' + sec;
    }
    decrement(){
        if(!this.time) {
            clearInterval(this.timerCall);
            audio.play();
            this.timerCall = 0;
            this.set(taskList.playNext());
        }
        else{
            this.time--;
        }
        this.flush();
    }

    flush(){
        document.querySelector(".display .name").innerHTML = this.name;

        document.querySelector(".display .time").innerHTML = this.formatTime(this.time);
        //console.log(this.time);
    }
}

class TaskList{
    constructor(list,repeat){
        this.index = 0;
        this.playCount = 0;
        this.list = list;
        this.repeat = repeat;
        this.timer = null;
        this.create();
    }
    
    create(index = this.list.length ,name = "Task Name " + (index+1), duration= 10){
        this.list.splice(index, 0, {'name': name ,'duration':duration} );
        //console.log(this.list);
        
        //Add DOM
        let li = document.createElement("li");
        let itemList = [];

        const domName = document.createElement("input");
        domName.type = "text";
        domName.className = "name";
        domName.value = name;
        domName.addEventListener("change", this);
        itemList.push(domName);

        const time = this.formatTime(duration);

        const min = this.createTimeDOM(time.min, "min");
        min.addEventListener('change',this);
        itemList.push(min);

        itemList.push(document.createTextNode(":"));

        const sec = this.createTimeDOM(time.sec, "sec");
        sec.addEventListener('change',this);
        itemList.push(sec);

        let up = document.createElement("button");
        up.innerHTML = "Up";
        up.className = "up";
        let that = this; //#4 Using Closure! But very Jankey :< Each button will have a function copy, which is not ideal.
        up.onclick = function moveUp(){
            const item = this.parentElement; //#3 Refactoring Point Seperating DOM and Data can be tricky for event this context
    
            if(item.previousElementSibling){
                const index = Array.prototype.indexOf.call(item.parentNode.children, item);
                that.swapItem(that.list, index, index - 1 );
                item.parentNode.insertBefore(item, item.previousElementSibling);
            }
        };
        itemList.push(up);

        let down = document.createElement("button");
        down.innerHTML = "Down";
        down.className = "down";
        down.onclick = function moveDown(){
            
            const item = this.parentElement;
            if(item.nextElementSibling){
                const index = Array.prototype.indexOf.call(item.parentNode.children, item);
                that.swapItem(that.list, index, index + 1 );
                item.parentNode.insertBefore(item.nextElementSibling, item);           
            }
        }
        itemList.push(down);

        for(let item of itemList){
            li.appendChild(item);
        }

        document.querySelector(".list").appendChild(li);
    }
    delete(index = this.list.length - 1){
        if(index < 0 ) return;
        this.list.splice(index, 1);
        //console.log(this.list);
        const list = document.querySelector(".list");
        list.removeChild(list.children[index]); // #2 Refactoring Point
    }
    current(){
        return this.list[this.index];
    }
    playNext(){
        switch(this.repeat){
            case REPEAT.ONE:
                return this.current();
            case REPEAT.ALL:
                if(this.index === this.list.length -1) this.index = -1;
            case REPEAT.NONE:
                return this.next();
        }
    }
    next(){
        if(this.index === this.list.length - 1 || this.list.length == 0) return null;
        return this.list[++(this.index)];
    }
    prev(){
        if(this.index === 0) return null;
        return this.list[--(this.index)];
    }
    
    formatTime(time){
        let sec = time % 60;
        const min = Math.floor(time/60);
        return {"min":min, "sec":sec};
    }

    createTimeDOM(value, name){
        let time = document.createElement("input");
        time.className = name;
        time.type = "number";
        time.value = String(value);
        time.min = "0";
        time.max = "59";
        return time;
    }



    swapItem(array,i,j){
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    handleEvent(event){
        const item = event.srcElement.parentElement;
        const index = Array.prototype.indexOf.call(item.parentNode.children, item);
        if(event.srcElement.className === "name"){
            this.list[index].name = event.srcElement.value;

            if(this.index == index){
                this.timer.name = event.srcElement.value;
                this.timer.flush();
            }
        }
        else{
            let duration = 60*parseInt(item.querySelector('.min').value)+parseInt(item.querySelector('.sec').value);
            if(isNaN(duration)) duration = 0;
            this.list[index].duration = duration;

            if(this.index == index){
                this.timer.duration = duration;
                if(this.timer.timerCall === 0){
                    this.timer.time = duration;
                    this.timer.flush();
                }
            }
        }


        
    }
}


const taskList = new TaskList([],false,REPEAT.NONE);
const audio = new Audio("service-bell_daniel_simion.mp3");
const timer = new Timer(taskList.current(),taskList);
taskList.timer = timer;

document.querySelector(".play").addEventListener('click',function(event){
    if(!timer.timerCall){
        timer.timerCall = setInterval( () =>timer.decrement() ,1000); //#1 Without Arrowfunction, dercrement: this is Window.
    }
})

document.querySelector(".pause").addEventListener('click',function(event){
    clearInterval(timer.timerCall);
    timer.timerCall = null;
})

document.querySelector(".stop").addEventListener('click',function(event){
    clearInterval(timer.timerCall);
    timer.timerCall = null;
    timer.time = timer.duration;
    timer.flush();
})

document.querySelector(".next").addEventListener('click',function(event){
    timer.set(taskList.next());
    timer.flush();
})

document.querySelector(".prev").addEventListener('click',function(event){
    timer.set(taskList.prev());
    timer.flush();
})

document.querySelector(".create").addEventListener('click',function(event){
    taskList.create();
})

document.querySelector(".delete").addEventListener('click',function(event){
    taskList.delete();
})

document.querySelector(".repeat").addEventListener('change',function(event){
    taskList.repeat = this.value;
})
