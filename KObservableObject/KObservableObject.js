define([],function(){

    function CreateObservableObject(name,parent,scope)
    {
        var _obj = {},
            _subscribers = {},

            /* actions stored locally */
            _actions = {
                add:[],
                set:[],
                remove:[],
                addDataListener:[],
                removeDataListener:[],
                addDataUpdateListener:[],
                removeDataUpdateListener:[],
                addDataCreateListener:[],
                removeDataCreateListener:[],
                addDataRemoveListener:[],
                removeDataRemoveListener:[]
            },

            /* Action/method based events to alter the action being performed */
            _onaction = function(a)
            {
                for(var x=0,_curr=_actions[a.type],len=_curr.length;x!==len;x++)
                {
                    _curr[x](a);
                    if(a._stopPropogration) break;
                }
                return a._preventDefault;
            },

            /* Data based events to alter the data being set */
            _onevent = function(e)
            {
                for(var x=0,_curr=e.local[e.listener],len=_curr.length;x!==len;x++)
                {
                    _curr[x](e);
                    if(e._stopPropogration) break;
                }
                return e._preventDefault;
            }
        
        /* Event Objects */
        function eventObject(obj,key,action,value,oldValue,args,listener)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.local = obj;
            this.key = key;
            this.arguments = args;
            this.type = action;
            this.listener = listener;
            this.name = obj.__kbname;
            this.root = obj.__kbref;
            this.scope = obj.__kbscopeString;
            this.parent = obj.___kbImmediateParent;
            this.value = value;
            this.oldValue = oldValue;
        }

        function actionObject(type,prop,ev,args)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.action = type;
            this.key = prop;
            this.event = ev;
            this.args = args;
        }

        /* Main Listening methods */
        function addListener(type)
        {
            var _listeners = this[type];
            return function(prop,func)
            {
                var e = new eventObject(this,prop,type,this[prop],this[prop],arguments),
                    a = new actionObject(type,prop,e,arguments);
                
                if(_onaction(a) !== true)
                {
                    _listeners[a.key,a.args[1]];
                }
                return this;
            }
        }

        function removeListener(type)
        {
            var _listeners = this[type];
            return function(prop,func)
            {
                var e = new eventObject(this,prop,type,this[prop],this[prop],arguments),
                    a = new actionObject(type,prop,e,arguments);

                if(_onaction(a) !== true)
                {
                    if(a.args[1] !== undefined) _listeners = _listeners[a.key];

                    for(var x=0,len=_listeners.length;x<len;x++)
                    {
                        if(_listeners[x].toString() === a.args[1].toString())
                        {
                            _listeners.splice(x,1);
                            return this;
                        }
                    }
                }
                return this;
            }
        }

        function addActionListener(action,func)
        {
            if(Object.keys(_actions).indexOf(action) !== -1)
            {
                _actions[action].push(func);
            }
            else
            {
                console.error('There is no action listener by the name: ',action);
            }
            return this;
        }

        function removeActionListener(action,func)
        {
            if(Object.keys(_actions).indexOf(action) !== -1)
            {
                for(var x=0,_curr=_actions[action],len=_curr.length;x!==len;x++)
                {
                    if(_curr[x].toString() === func.toString())
                    {
                        _curr.splice(x,1);
                        return this;
                    }
                }
            }
            else
            {
                console.error('There is no action listener by the name: ',action);
            }
            return this;
        }

        /* Helpers */
        function isObject(v)
        {
            return (typeof v === 'object' && !!v && (String.prototype.toString.call(v) === '[object Object]'));
        }

        function isArray(v)
        {
            return (Object.prototype.toString.call(v) === '[object Array]');
        }

        function isObservable(obj,prop)
        {
            return (Object.getOwnPropertyDescriptor(obj,prop).value === undefined);
        }

        /* Additional functionality */
        function prototype(prop,value)
        {
          if(this[prop] === undefined)
          {
              Object.defineProperty(this.__proto__,prop,setDescriptor(value,true,true));
          }
          else
          {
            console.error('Your attempting to add the your method with the prop: ',prop,' that already exists');
          }
          return this;
        }

        function stringify()
        {
            var cache = [];
            return JSON.stringify(this,function(key, value) {
                if(isArray(value) || isObject(value)) 
                {
                    if (cache.indexOf(value) !== -1)
                    {
                        return;
                    }
                    cache.push(value);
                }
                return value;
            });
        }

        /*Event based functionality */
        function add(prop,value)
        {
            var e = new eventObject(this,prop,'add',value,undefined,arguments,'__kbdatacreatelisteners'),
                a = new actionObject('add',prop,e,arguments);
            
            if(_onaction(a) !== true)
            {
                if(this[a.key] === undefined)
                {
                    if(_onevent(e) !== true)
                    {
                        Object.defineProperty(this,a.key,setBindDescriptor.call(this,a.args[1],a.key));
                    }
                }
                else
                {
                    console.error('Your attempting to add the property: ',a.key,' that already exists on',this,'try using set or direct set instead');
                }
            }
            return this;
        }

        function addPointer(objArr,prop,newProp)
        {
            var e = new eventObject(this,(newProp || prop),'add',objArr[prop],undefined,arguments,'__kbdatacreatelisteners'),
                a = new actionObject('add',(newProp || prop),e,arguments);

            if(_onaction(a) !== true)
            {
                if(_onevent(e) !== true)
                {
                    var desc = Object.getOwnPropertyDescriptor(objArr,prop);
                    Object.defineProperty(this,a.key,setPointer(objArr,prop,desc));
                }
            }
            return this;
        }

        function set(prop,value,stopChange)
        {
            var e = new eventObject(this,prop,'set',value,this[prop],arguments,'__kblisteners'),
                a = new actionObject('set',prop,e,arguments);
            
            if(_onaction(a) !== true)
            {
                if(this[prop] === undefined)
                {
                    this.add(a.key,a.args[1]);
                }
                else
                {
                    if(_onevent(e) !== true)
                    {
                        if(isObservable(this,a.key))
                        {
                            Object.getOwnPropertyDescriptor(this,a.key).set.call(this,a.args[1],stopChange);
                        }
                        else
                        {
                            Object.defineProperty(this,a.key,setBindDescriptor.call(this,a.args[1],a.key));
                        }
                    }
                }
            }
            return this;
        }

        function remove(prop)
        {
            var e = new eventObject(this,prop,'remove',this[prop],this[prop],arguments,'__kbdatadeletelisteners'),
                a = new actionObject('remove',prop,e,arguments);
            
            if(_onaction(a) !== true)
            {
                if(this[a.key] === undefined)
                {
                    console.error('Your attempting to remove the property: ',a.key,' that does not exist on ',this);
                    return this;
                }

                if(_onevent(e) !== true)
                {
                    Object.defineProperty(this,a.key,{
                        value:null,
                        writable:true,
                        enumerable:true,
                        configurable:true
                    });
                }
            }
            return this;
        }

        /* Descriptor based methods */
        function setPointer(obj,prop,desc)
        {
            return {
                get:function(){
                    return obj[prop];
                },
                set:function(v){
                    obj[prop] = v;
                },
                enumerable:desc.enumerable,
                configurable:desc.configurable
            }
        }

        function setDescriptor(value,writable,redefinable)
        {
            return {
                value:value,
                writable:!!writable,
                enumerable:false,
                configurable:!!redefinable
            }
        }

        function setBindDescriptor(value,index)
        {
            var _value = value,
                _oldValue = value,
                _prop = index,
                _set = function(v,e)
                {
                    _oldValue = _value;
                    _value = v;
                    e.listener = '__kbupdatelisteners';
                    e.type = 'update';
                    _onevent(e);
                };
            return {
                get:function(){
                    return _value;
                },
                set:function(v,stopChange)
                {
                    var e = new eventObject(this,_prop,'set',v,_value,arguments,'__kblisteners');

                    if(!stopChange)
                    {
                        if(_onevent(e) !== true)
                        {
                            _set(v,e);
                            this.callSubscribers(_prop,_value,_oldValue);
                        }
                    }
                    else
                    {
                        _set(v,e);
                    }
                },
                configurable:true,
                enumerable:true
            }
        }

        /* Subscriber methods */
        function subscribe(prop,func)
        {
            if(_subscribers[prop] === undefined) _subscribers[prop] = [];
            _subscribers[prop].push(func);
            return this;
        }

        function unsubscribe(prop,func)
        {
          if(_subscribers[prop] !== undefined)
          {
            loop:for(var x=0,len=_subscribers[prop].length;x<len;x++)
            {
                if(_subscribers[prop][x].toString() === func.toString())
                {
                  _subscribers[prop].splice(x,1);
                  break loop;
                }
            }
          }
          return this;
        }

        function callSubscribers(prop,value,oldValue)
        {
            if(_subscribers[prop] !== undefined)
            {
                var e = new eventObject(this,prop,'subscriber',value,oldValue);
                for(var x=0,len=_subscribers[prop].length;x<len;x++)
                {
                    _subscribers[prop][x](e);
                    if(e._stopPropogration) break;
                }
            }
            return this;
        }

        /* Define all properties */
        Object.defineProperties(_obj,{
            __kbname:setDescriptor((name || ""),true,true),
            __kbref:setDescriptor((parent ? (parent.__kbref || parent) : _obj),true,true),
            __kbscopeString:setDescriptor((scope || ""),true,true),
            __kbImmediateParent:setDescriptor((parent || null),true,true),
            add:setDescriptor(add),
            addPointer:setDescriptor(addPointer),
            prototype:setDescriptor(prototype),
            set:setDescriptor(set),
            remove:setDescriptor(remove),
            stringify:setDescriptor(stringify),
            callSubscribers:setDescriptor(callSubscribers),
            subscribe:setDescriptor(subscribe),
            unsubscribe:setDescriptor(unsubscribe),
            __kblisteners:setDescriptor({}),
            __kbupdatelisteners:setDescriptor({}),
            __kbparentlisteners:setDescriptor({}),
            __kbparentupdatelisteners:setDescriptor({}),
            __kbdatacreatelisteners:setDescriptor([]),
            __kbdatadeletelisteners:setDescriptor([]),
            addActionListener:setDescriptor(addActionListener),
            removeActionListener:setDescriptor(removeActionListener),
            onadd:setDescriptor(function(){},true),
            onremove:setDescriptor(function(){},true),
            onset:setDescriptor(function(){},true),
            onupdate:setDescriptor(function(){},true)
        });

        Object.defineProperties(_obj,{
            addDataListener:setDescriptor(addListener('__kblisteners')),
            removeDataListener:setDescriptor(removeListener('__kblisteners')),
            addDataUpdateListener:setDescriptor(addListener('__kbupdatelisteners')),
            removeDataUpdateListener:setDescriptor(removeListener('__kbupdatelisteners')),
            addDataCreateListener:setDescriptor(addListener('__kbdatacreatelisteners')),
            removeDataCreateListener:setDescriptor(removeListener('__kbdatacreatelisteners')),
            addDataRemoveListener:setDescriptor(addListener('__kbdatadeletelisteners')),
            removeDataRemoveListener:setDescriptor(removeListener('__kbdatadeletelisteners'))
        });


        return _obj;
    }
    return CreateObservableObject;
});
