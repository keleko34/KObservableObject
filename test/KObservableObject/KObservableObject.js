define([],function(){

    function CreateObservableObject(name,parent,scope)
    {
        var _obj = {},
            _subscribers = {},

            /* actions stored locally */
            _actions = {
                add:[],
                postadd:[],
                set:[],
                postset:[],
                remove:[],
                postremove:[],
                subscribe:[],
                unsubscribe:[],
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

            _loopEvents = function(events,e)
            {
                if(!e._stopPropogration && events)
                {
                for (var x = 0, len = events.length; x !== len; x++) {
                    events[x](e);
                    if (e._stopPropogration) break;
                }
                }
            },

            /* Data based events to alter the data being set */
            _onevent = function(e)
            {
                var _local = e.local[e.listener];
                    if(isObject(_local))
                    {
                      _loopEvents(_local[e.key],e);

                      if(e.listener === '__kblisteners')
                      {
                        _loopEvents(_local['*'],e);

                        e.fromListener = '__kblisteners';
                        e.listener = '__kbparentlisteners';

                        _loopEvents(e.local[e.listener][e.key],e);
                        _loopEvents(e.local[e.listener]['*'],e);

                      }
                      else if(e.listener === '__kbupdatelisteners')
                      {
                         _loopEvents(_local['*'],e);

                        e.fromListener = '__kbupdatelisteners';
                        e.listener = '__kbparentupdatelisteners';

                        _loopEvents(e.local[e.listener][e.key],e);
                        _loopEvents(e.local[e.listener]['*'],e);

                      }
                    }
                    else if(isArray(_local))
                    {
                       _loopEvents(_local,e);
                       _loopEvents(_local['*'],e);
                    }
                    return e._preventDefault;
            }
        
        /* Event Objects */
        function eventObject(obj,key,action,value,oldValue,args,listener,stopChange)
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
            this.stopChange = stopChange;
        }

        function actionObject(type,prop,ev,args)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.type = type;
            this.key = prop;
            this.event = ev;
            this.args = args;
        }

        /* Main Listening methods */
        function addListener(type,listener)
        {
            var _listeners = _obj[listener];
            return function(prop, func)
            {
                var e = new eventObject(this, (isObject(_listeners) ? prop : ""), type, (isObject(_listeners) ? this[prop] : ""), (isObject(_listeners) ? this[prop] : ""), arguments),
                    a = new actionObject(type, (isObject(_listeners) ? prop : ""), e, arguments),
                    c;
                if (_onaction(a) !== true) {
                    if(isObject(_listeners))
                    {
                        if(_listeners[a.key] === undefined) _listeners[a.key] = [];
                        c = _listeners[a.key];
                        c.push(a.args[1]);
                    }
                    else if(isArray(_listeners))
                    {
                        if(_listeners['*'] === undefined) _listeners['*'] = [];
                        c = (a.args[1] && a.args[1] === '*' ? _listeners['*'] : _listeners);
                        c.push(a.args[0]);
                    }
                }
                return this;
            }
        }

        function removeListener(type,listener)
        {
            var _listeners = _obj[listener];
            return function(prop,func)
            {
                var e = new eventObject(this,prop,type,this[prop],this[prop],arguments),
                    a = new actionObject(type,prop,e,arguments),
                    c;

                if(_onaction(a) !== true)
                {
                    if(isObject(_listeners))
                    {
                        c = _listeners[a.key];
                        if(c)
                        {
                          for(var x=0,len=c.length;x<len;x++)
                          {
                              if(c[x].toString() === a.args[1].toString())
                              {
                                  c.splice(x,1);
                                  return this;
                              }
                          }
                        }
                    }
                    else if(isArray(_listeners))
                    {
                        if(_listeners['*'] === undefined) _listeners['*'] = [];
                        c = (a.args[1] && a.args[1] === '*' ? _listeners['*'] : _listeners);
                        for(var x=0,len=c.length;x<len;x++)
                        {
                            if(c[x].toString() === a.args[0].toString())
                            {
                                c.splice(x,1);
                                return this;
                            }
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
            return (typeof v === 'object' && !!v && (v.constructor.toString() === Object.toString()));
        }

        function isArray(v) 
        {
            return (typeof v === 'object' && !!v && (v.constructor.toString() === Array.toString()));
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
                        a.type = 'postadd';
                        _onaction(a);
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
                    a.type = 'postadd';
                    _onaction(a);
                }
            }
            return this;
        }

        function set(prop,value)
        {
            var e = new eventObject(this,prop,'set',value,this[prop],arguments,'__kblisteners'),
                a = new actionObject('set',prop,e,arguments);
            

                if(this[prop] === undefined)
                {
                    this.add(a.key,a.args[1]);
                }
                else
                {
                  if(_onaction(a) !== true)
                  {
                    e.key = a.key;
                    e.value = a.args[1];
                    if(_onevent(e) !== true)
                    {
                        if(isObservable(this,a.key))
                        {
                            this[a.key] = a.args[1];
                        }
                        else
                        {
                            Object.defineProperty(this,a.key,setBindDescriptor.call(this,a.args[1],a.key));
                        }
                        a.type = 'postset';
                        _onaction(a);
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
                    a.type = 'postremove';
                    _onaction(a);
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
                    (this._stopChange ? obj.stopChange() : obj)[prop] = v;
                  this._stopChange = undefined;
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
                  if(!e.stopChange)
                  {
                    e.listener = '__kbupdatelisteners';
                    e.type = 'update';
                    _onevent(e);
                  }
                };
            return {
                get:function(){
                    return _value;
                },
                set:function(v)
                {
                    var e = new eventObject(this,_prop,'set',v,_value,arguments,'__kblisteners',this._stopChange);

                    if(_onevent(e) !== true)
                    {
                       _set(v,e);
                       if(!this._stopChange) this.callSubscribers(_prop,_value,_oldValue);
                    }
                  this._stopChange = undefined;
                },
                configurable:true,
                enumerable:true
            }
        }

        /* Subscriber methods */
        function subscribe(prop,func)
        {
            var e = new eventObject(this,prop,'subscribe',this[prop],undefined,arguments),
                a = new actionObject('subscribe',prop,e,arguments);
            if(_onaction(a) !== true)
            {
                if(_subscribers[a.key] === undefined) _subscribers[a.key] = [];
                _subscribers[a.key].push(func);
            }
            return this;
        }

        function unsubscribe(prop,func)
        {
            var e = new eventObject(this,prop,'unsubscribe',this[prop],undefined,arguments),
                a = new actionObject('unsubscribe',prop,e,arguments);
            if(_onaction(a) !== true)
            {
                if(_subscribers[a.key] !== undefined)
                {
                    loop:for(var x=0,len=_subscribers[a.key].length;x<len;x++)
                    {
                        if(_subscribers[a.key][x].toString() === func.toString())
                        {
                            _subscribers[a.key].splice(x,1);
                            break loop;
                        }
                    }
                }
            }
          return this;
        }

        function callSubscribers(prop,value,oldValue)
        {
            if(_subscribers[prop] !== undefined)
            {
                for(var x=0,len=_subscribers[prop].length;x<len;x++)
                {
                    _subscribers[prop][x](prop,value,oldValue);
                }
            }
            if(_subscribers['*'] !== undefined)
            {
                for(var x=0,len=_subscribers['*'].length;x<len;x++)
                {
                    _subscribers['*'][x](prop,value,oldValue);
                }
            }
            return this;
        }

        function stopChange()
        {
          this._stopChange = true;
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
            onupdate:setDescriptor(function(){},true),
            stopChange:setDescriptor(stopChange)
        });

        Object.defineProperties(_obj,{
            addDataListener:setDescriptor(addListener('addDataListener','__kblisteners')),
            removeDataListener:setDescriptor(removeListener('removeDataListener','__kblisteners')),
            addDataUpdateListener:setDescriptor(addListener('addDataUpdateListener','__kbupdatelisteners')),
            removeDataUpdateListener:setDescriptor(removeListener('removeDataUpdateListener','__kbupdatelisteners')),
            addDataCreateListener:setDescriptor(addListener('addDataCreateListener','__kbdatacreatelisteners')),
            removeDataCreateListener:setDescriptor(removeListener('removeDataCreateListener','__kbdatacreatelisteners')),
            addDataRemoveListener:setDescriptor(addListener('addDataRemoveListener','__kbdatadeletelisteners')),
            removeDataRemoveListener:setDescriptor(removeListener('removeDataRemoveListener','__kbdatadeletelisteners'))
        });


        return _obj;
    }
    return CreateObservableObject;
});
