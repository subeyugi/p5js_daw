let mouseStartX = -1;
let mouseStartY = -1;
let mouseEndX = -1;
let mouseEndY = -1;
let gridIntervalX = 25;
let gridIntervalY = 10;
let saveButton;
let playButton;
let tempoBox;
let SnapSelect;
let snapOption = ["1/6", "1/4", "1/3", "1/2", "1", "2", "4"];
let snap = 1 / 2;
let resetButton;
let resolution = 12;
let nowKey = -1;
let nowKeyCode = -1;
let nowPlay = -1;
let taskBarY = 0;
let cntNote = 0;
let taskBarSpace = 50;
let textPositionY = 0;
let buttonPositionY = 0;
let selectNoteIdx = [];
let song;
let polySynth;
let backGround = 200;
let lineColor1 = 100;
let lineColor2 = 150;
let red = [255, 0, 0];
let music;
let isWhite = [1, 0, 1, 2, 0, 1, 0, 1, 1, 0, 1, 0];
let keyBoardColor = [180, 220, 255];
let freq = [];
let volume = 0.1;
let speed = 2;
let copyNotes = [];

class Note{
    constructor(note, start, end){
        this.available_ = true;
        this.selected_ = false;
        this.note_ = note;
        this.start_ = start;
        this.end_ = end;
    }
};

class Track{
    constructor(instrument){
        this.instrument_ = instrument;
        this.notes_ = [];
        this.midiData_ = [];
    }

    addNote(note, erase){
        for(let i = 0; i < this.notes_.length; ++i){
            if(this.notes_[i].note_ == note.note_){//同じ音があれば
                if(this.notes_[i].end_ <= note.start_) continue;
                if(note.end_ <= this.notes_[i].start_) continue;
                this.notes_[i].available_ = false;
            }
        }
        if(!erase){
            this.notes_.push(note);
        }
    }

    updateMidi(){
        let query = [];
        for(let i = 0; i < this.notes_.length; ++i){
            if(this.notes_[i].available_){
                query.push([0x2d + this.notes_[i].note_, this.notes_[i].start_ * resolution, 0x7f]);//音を鳴らす        (note, start, volume)
                query.push([0x2d + this.notes_[i].note_, this.notes_[i].end_ * resolution, 0]);     //鳴らすのをやめる
            }
        }

        query.sort((x, y) => x[1] - y[1]);
        let data = [0x4d, 0x54, 0x72, 0x6b];//MTrk
        data = concat(data, toHex(query.length * 4 + 4, 4));
        let preTime = 0;
        for(let i = 0; i < query.length; ++i){
            data = concat(data, [(query[i][1] - preTime), 0x90, query[i][0], query[i][2]]);  //音を鳴らす
            preTime = query[i][1];
        }
        data = concat(data, [0x00, 0xff, 0x2f, 0x00]);  //トラックエンド
        this.midiData_ = data;
    }
};

class Music{
    constructor(){
        this.tracks_ = [];
    }

    createData(){
        let data = [0x4d, 0x54, 0x68, 0x64];                  //MThd
        data = concat(data, [0x00, 0x00, 0x00, 0x06]);        //ブロック長
        data = concat(data, [0x00, 0x01]);                    //フォーマット
        data = concat(data, [0x00, this.tracks_.length + 1]); //トラック数
        data = concat(data, toHex(resolution * 16, 2));       //四分音符の分解能

        data = concat(data, [0x4d, 0x54, 0x72, 0x6b]);
        data = concat(data, [0x00, 0x00, 0x00, 0x0b]);
        data = concat(data, [0x00, 0xff, 0x51, 0x03, 0x70, 0xa1, 0x20]);
        data = concat(data, [0x00, 0xff, 0x2f, 0x00]);
        

        for(let i = 0; i < this.tracks_.length; ++i){
            this.tracks_[i].updateMidi();
            data = concat(data, this.tracks_[i].midiData_);
        }
        return data;
    }

    saveFile(){
        saveFile(this.createData());
    }
}

function saveFile(data){
    //https://urusulambda.wordpress.com/2018/09/15/javascript%E3%81%A7%E3%83%90%E3%82%A4%E3%83%8A%E3%83%AA%E3%83%BC%E3%83%87%E3%83%BC%E3%82%BF%E3%82%92%E4%BD%9C%E3%81%A3%E3%81%A6%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%82%92%E4%BF%9D%E5%AD%98%E3%81%99/
    let buffer = new ArrayBuffer(data.length);
    let dv = new DataView(buffer);
    for(let i = 0; i < data.length; ++i){
        dv.setUint8(i, data[i]);
    }
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    console.log(a);

    //ArrayBufferをBlobに変換                                                                                                                                                
    var blob = new Blob([buffer], {type: "octet/stream"}),
    url = window.URL.createObjectURL(blob);
    console.log(url);

    //データを保存する                                                                                                                                                     
    a.href = url;
    a.download = "music.midi";
    a.click();
    window.URL.revokeObjectURL(url);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    cntNote = int((windowHeight - taskBarSpace) / gridIntervalY);
    taskBarY = cntNote * gridIntervalY;
    textPositionY = taskBarY + 25;
    buttonPositionY = taskBarY + 30;
    music = new Music();
    music.tracks_[0] = new Track("piano");
    saveButton = createButton("save");
    saveButton.mousePressed(saveClicked);
    saveButton.position(0, buttonPositionY);
    playButton = createButton("play");
    playButton.mousePressed(playClicked);
    playButton.position(50, buttonPositionY);
    tempoBox = createInput("120", "number");
    tempoBox.size(40);
    tempoBox.position(100, buttonPositionY);
    snapSelect = createSelect();
    for(let i = 0; i < snapOption.length; ++i){
      snapSelect.option(snapOption[i]);
    }
    snapSelect.position(160, buttonPositionY);
    snapSelect.selected("1");
    snapSelect.changed(changeSnap);
    resetButton = createButton("reset");
    resetButton.position(210, buttonPositionY);
    resetButton.mousePressed(resetClicked);
    polySynth = new p5.PolySynth();
    for(let i = 0; i < cntNote; ++i){
        freq[i] = 110.0 * pow(2.0, i / 12.0);
    }
}

function draw() {
    background(backGround);

    showGrid();
    showPointer();
}

function mousePressed(){
    if(!fullscreen()){
      fullscreen(true);
      return;
    }
    if(mouseY >= taskBarY){//範囲外選択
        unselectAll();
        return;
    }
    
    mouseStartX = getMouseXIdx();
    mouseStartY = getMouseYIdx();
    mouseEndX = -1;
    mouseEndY = -1;
    if(findSelectedNote() && nowKeyCode == SHIFT){
        unselectAll(true);
    }
    if(nowKey == 'a'){//a: 複数選択
        
    }else if(nowKey == 'p'){//p : 和音を鳴らす
        for(let i = 0; i < music.tracks_[0].notes_.length; ++i){
            let note = music.tracks_[0].notes_[i];
            if(note.available_){
                if(note.start_ <= mouseStartX && mouseStartX < note.end_){
                    polySynth.noteAttack(freq[note.note_], volume);
                }
            }
        }
    }else if(nowKeyCode != SHIFT){//単一選択
        polySynth.noteAttack(freq[mouseStartY], volume);
        nowPlay = mouseStartY;
    }
}

function mouseDragged(){
    if(mouseStartX == -1 || mouseStartY == -1) return;
    if(mouseY >= taskBarY) return;
    if(nowKey == 'p') return;
    
    mouseEndX = getMouseXIdx();
    mouseEndY = getMouseYIdx();
    if(selectNoteIdx.length > 0){
        if(nowKey == 'w'){//w: 選択ノート横移動
            for(let i = 0; i < selectNoteIdx.length; ++i){
                music.tracks_[0].notes_[selectNoteIdx[i]].start_ += (mouseEndX - mouseStartX);
                music.tracks_[0].notes_[selectNoteIdx[i]].end_ += (mouseEndX - mouseStartX);
            }
            mouseStartX = mouseEndX;
        }else{
            for(let i = 0; i < selectNoteIdx.length; ++i){
                music.tracks_[0].notes_[selectNoteIdx[i]].note_ += (mouseEndY - mouseStartY);
            }
            mouseStartY = mouseEndY;
        }
        return;
    }
    if(nowKey == 'a'){
        
    }
    if(nowKey != 'a'){
        mouseStartY = mouseEndY;
    }

    if(nowKey != 'a' && nowKey != 'p' && nowPlay != mouseEndY){
        polySynth.noteRelease();
        polySynth.noteAttack(freq[mouseEndY], volume, 0.05);
        nowPlay = mouseEndY;
    }
}

function mouseReleased(){
    polySynth.noteRelease();
    if(mouseStartX == -1 || mouseStartY == -1 || mouseY >= taskBarY){
      mouseStartX = -1;
      mouseStartY = -1;
      mouseEndX = -1;
      mouseEndY = -1;
      return;
    }
    if(selectNoteIdx.length > 0) return;
    
    mouseEndX = getMouseXIdx()
    mouseEndY = getMouseYIdx();
    if(mouseEndY < 0){
        mouseStartX = -1;
        mouseStartY = -1;
        return;
    }
    if(nowKey == 'a'){//a: 選択区間削除
        findSelectedNote();
    }else if(nowKey == 'p'){//p: 再生

    }else if(mouseStartY == mouseEndY && mouseStartX < mouseEndX){//単一追加・削除
        music.tracks_[0].addNote(new Note(mouseStartY, mouseStartX, mouseEndX), nowKey === SHIFT);
    }
    mouseStartX = -1;
    mouseStartY = -1;
    mouseEndX = -1;
    mouseEndY = -1;
    nowPlay = -1;
}

function showGrid(){
    stroke(lineColor1);
    for(let i = 0; i <= cntNote; ++i){//横線
        line(0, i * gridIntervalY, windowWidth, i * gridIntervalY);
    }
    for(let i = 0; i < cntNote; ++i){//塗りつぶし
        fill(keyBoardColor[isWhite[i % 12]]);
        rect(0, (cntNote - i - 1) * gridIntervalY, windowWidth, gridIntervalY);
    }

    for(let i = 0; i < cntNote; ++i){//縦線
        if(i % 4 == 0) stroke(lineColor1);
        else stroke(lineColor2);
        line(i * gridIntervalX, 0, i * gridIntervalX, taskBarY);
    }

    for(let i = 0; i < music.tracks_.length; ++i){
        for(let j = 0; j < music.tracks_[i].notes_.length; ++j){
            const note = music.tracks_[i].notes_[j];
            if(note.available_){
                if(note.selected_) fill(dark(red));
                else fill(red);
                rect(note.start_ * gridIntervalX, (cntNote - note.note_ - 1) * gridIntervalY, (note.end_ - note.start_) * gridIntervalX, gridIntervalY);
            }
        }
    }

    stroke(200);
    let nowX = getMouseXIdx();
    line(nowX * gridIntervalX, 0, nowX * gridIntervalX, taskBarY);

    fill(0);
    noStroke();
    text("tempo", 105, textPositionY);
    text("snap", 165, textPositionY);
}

function showPointer(){
    if(selectNoteIdx.length == 0 && mouseStartX >= 0 && mouseStartX < mouseEndX){
        fill(light(red));
        rect(mouseStartX * gridIntervalX, (cntNote - mouseStartY - 1) * gridIntervalY, (mouseEndX - mouseStartX) * gridIntervalX, (-mouseEndY + mouseStartY + 1) * gridIntervalY);
    }
}

function saveClicked(){
    music.saveFile();
}

function playClicked(){
    music.tracks_[0].notes_.sort((x, y) => x.start_ - y.start_);
    for(let i = 0; i < music.tracks_[0].notes_.length; ++i){
        let note = music.tracks_[0].notes_[i];
        if(note.available_){
          polySynth.play(freq[note.note_], volume, note.start_ / speed, (note.end_ - note.start_) / speed - 0.1);
        }
    }
}

function keyPressed(){
    nowKey = key;
    nowKeyCode = keyCode;
    if(nowKeyCode == DELETE && selectNoteIdx.length > 0){
        unselectAll(true);
    }else if(keyIsDown(CONTROL) && nowKey == 'c'){//ctrl + c: 選択ノートコピー
        copyNotes = [];
        for(let i = 0; i < music.tracks_[0].notes_.length; ++i){
            let note = music.tracks_[0].notes_[i];
            if(note.selected_){
                copyNotes.push(note);
            }
        }
    }else if(keyIsDown(CONTROL) && nowKey == 'x'){//ctrl + x: 選択ノートカット
        copyNotes = [];
        for(let i = 0; i < music.tracks_[0].notes_.length; ++i){
            let note = music.tracks_[0].notes_[i];
            if(note.selected_){
                copyNotes.push(note);
            }
        }
        unselectAll(true);
    }else if(keyIsDown(CONTROL) && nowKey == 'v'){//ctrl + v: 貼り付け
        let nowX = getMouseXIdx();
        let firstNoteX = Infinity;
        for(let i = 0; i < copyNotes.length; ++i){
            if(copyNotes[i].start_ < firstNoteX){
                firstNoteX = copyNotes[i].start_;
            }
        }
        for(let i = 0; i < copyNotes.length; ++i){
            music.tracks_[0].notes_.push(new Note(copyNotes[i].note_, copyNotes[i].start_ - firstNoteX + nowX, copyNotes[i].end_ - firstNoteX + nowX));
        }
    }
}

function keyReleased(){
    nowKey = -1;
    nowKeyCode = -1;
}

function toHex(num, byte){
    let result = [];
    for(let i = 0; i < byte; ++i){
        result[byte - i - 1] = num % 256;
        num = int(num / 256);
    }
    return result;
}

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);
    cntNote = int((windowHeight - taskBarSpace) / gridIntervalY);
    taskBarY = cntNote * gridIntervalY;
    textPositionY = taskBarY + 20;
    buttonPositionY = taskBarY + 25;
    saveButton.position(0, buttonPositionY);
    playButton.position(50, buttonPositionY);
    tempoBox.position(100 ,buttonPositionY);
    snapSelect.position(160, buttonPositionY);
    resetButton.position(210, buttonPositionY);
    for(let i = 0; i < cntNote; ++i){
        freq[i] = 110.0 * pow(2.0, i / 12.0);
    }
}

function getMouseXIdx(){
    return round(mouseX / gridIntervalX / snap) * snap;
}

function getMouseYIdx(){
    return cntNote - round(mouseY / gridIntervalY - 0.5) - 1;
}

function changeSnap(){
    if(snapSelect.value() == "1/6")      snap = 1 / 6;
    else if(snapSelect.value() == "1/4") snap = 1 / 4;
    else if(snapSelect.value() == "1/3") snap = 1 / 3;
    else if(snapSelect.value() == "1/2") snap = 1 / 2;
    else if(snapSelect.value() == "1")   snap = 1;
    else if(snapSelect.value() == "2")   snap = 2;
    else if(snapSelect.value() == "4")   snap = 4;
}

function resetClicked(){
  polySynth.disconnect();
  polySynth = new p5.PolySynth();
}

function light(color){
    return [color[0], color[1], color[2], 30];
}

function dark(color){
    return [max(0, color[0] - 50), max(0, color[1] - 50), max(0, color[2] - 50)];
}

function findSelectedNote(){
    if(mouseEndX == -1 && mouseEndY == -1){//単一ノート選択
        if(selectNoteIdx.length > 0){
            for(let i = 0; i < music.tracks_[0].notes_.length; ++i){
                let note = music.tracks_[0].notes_[i];
                if(note.start_ <= mouseStartX && mouseStartX <= note.end_ && note.note_ == mouseStartY){
                    return true;
                }
            }
            unselectAll();
            return false;
        }else{
            selectNoteIdx = [];
            for(let i = 0; i < music.tracks_[0].notes_.length; ++i){
                let note = music.tracks_[0].notes_[i];
                if(note.start_ <= mouseStartX && mouseStartX <= note.end_ && note.note_ == mouseStartY){
                    music.tracks_[0].notes_[i].selected_ = true;
                    selectNoteIdx.push(i);
                }
            }    
            return selectNoteIdx.length > 0;
        }
    }else{//複数ノート選択
        selectNoteIdx = [];
        for(let i = 0; i < music.tracks_[0].notes_.length; ++i){
            let note = music.tracks_[0].notes_[i];
            if(mouseStartX <= note.start_ && note.end_ <= mouseEndX && mouseEndY <= note.note_ && note.note_ <= mouseStartY){
                music.tracks_[0].notes_[i].selected_ = true;
                selectNoteIdx.push(i);
            }
        }
        return selectNoteIdx.length > 0;
    }
}

function unselectAll(isDelete = false){
    for(let i = 0; i < selectNoteIdx.length; ++i){
        music.tracks_[0].notes_[selectNoteIdx[i]].selected_ = false;
        if(isDelete){
            music.tracks_[0].notes_[selectNoteIdx[i]].available_ = false;
        }
    }
    selectNoteIdx = [];
}

/*
参考
https://qiita.com/cagpie/items/b4646518eea1237951ca
https://github.com/dingram/jsmidgen
https://github.com/yyagi8864/smfspec
*/