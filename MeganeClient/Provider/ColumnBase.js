module.exports = class ColumnBase{
    constructor(){
    }
    init(client){
        throw new Error(`${this.construtor.name} does not have a initProvider function.`);
    }
    destroy(client){
        throw new Error(`${this.construtor.name} does not have a destroyProvider function.`);
    }
    get(id, key, defVal){
        throw new Error(`${this.construtor.name} does not have a get function.`);
    }
    set(id, key, defVal){
        throw new Error(`${this.construtor.name} does not have a set function.`);
    }
}