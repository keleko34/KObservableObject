define([],function(){

    function CreateObservableObject(name,parent,scope)
    {
        var _obj = {},
            _actions = {
                add:[],
                set:[],
                remove:[]
            },
            _onaction = function(obj,key,type,value,oldValue,args)
            {
                var e = new eventObject(obj,key,type,value,oldValue,args);

                for(var x=0,_curr=_actions[type],len=_curr.length;x!==len;x++)
                {
                    _curr[x](e);
                    if(e._stopPropogration) break;
                }
                return e._preventDefault;
            },
            _subscribers = {},
            _onset = function(obj,key,action,value,oldValue)
            {
              var e = new eventObject(obj,key,action,value,oldValue);
              _obj.onset(e);
              return e._preventDefault;
            },
            _onupdate = function(obj,key,action,value,oldValue)
            {
              var e = new eventObject(obj,key,action,value,oldValue);
              _obj.onupdate(e);
              return e._preventDefault;
            },
            _onadd = function(obj,key,action,value,oldValue)
            {
              var e = new eventObject(obj,key,action,value,oldValue);
              _obj.onadd(e);
              return e._preventDefault;
            },
            _onremove = function(obj,key,action,value,oldValue)
            {
              var e = new eventObject(obj,key,action,value,oldValue);
              _obj.onremove(e);
              return e._preventDefault;
            }

        function eventObject(obj,key,action,value,oldValue,args)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.local = obj;
            this.key = key;
            this.arguments = args;
            this.type = action;
            this.name = obj.__kbname;
            this.root = obj.__kbref;
            this.scope = obj.__kbscopeString;
            this.parent = obj.___kbImmediateParent;
            this.value = value;
            this.oldValue = oldValue;
        }

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

        function add(prop,value)
        {
            if(this[prop] === undefined)
            {
                if(_onadd(this,prop,'add',value) !== true)
                {
                    Object.defineProperty(this,prop,setBindDescriptor.call(this,value,prop));
                    _onaction(this, prop,'add',value,undefined,arguments);
                }
            }
            else
            {
                console.error('Your attempting to add the property: ',prop,' that already exists on',this,'try using set or direct set instead');
                return this;
            }
            return this;
        }

        function addPointer(objArr,prop,newProp)
        {
            if(_onadd(this,(newProp || prop),'add',objArr[prop]) !== true)
            {
                var desc = Object.getOwnPropertyDescriptor(objArr,prop);
                Object.defineProperty(this,(newProp || prop),setPointer(objArr,prop,desc));
                _onaction(this, (newProp || prop),'add',objArr[prop],undefined,arguments);
            }
            return this;
        }

        function set(prop,value,stopChange)
        {
            if(this[prop] === undefined)
            {
                this.add(value,prop);
            }
            else
            {
              if(_onset(this,prop,'set',value) !== true)
              {
                  var old = this[prop];
                  if(isObservable(this,prop))
                  {
                      Object.getOwnPropertyDescriptor(this,prop).set.call(this,value,stopChange);
                  }
                  else
                  {
                      Object.defineProperty(this,prop,setBindDescriptor.call(this,value,prop));
                  }
                  _onaction(this, prop,'set',value,old,arguments);
              }
            }
            return this;
        }

        function remove(prop)
        {
            if(this[prop] === undefined)
            {
                console.error('Your attempting to remove the property: ',prop,' that does not exist on ',this);
                return this;
            }
            if(_onremove(this,prop,'remove',this[prop]) !== true)
            {
                var val = this[prop];
                Object.defineProperty(this,prop,{
                    value:undefined,
                    writable:true,
                    enumerable:true,
                    configurable:true
                });
                _onaction(this, prop,'remove',val,undefined,arguments);
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

        function addListener(type)
        {
            var _listeners = this[type];
            return function(prop,func)
            {
                _listeners[prop] = func;
                return this;
            }
        }

        function removeListener(type)
        {
            var _listeners = this[type];
            return function(prop,func)
            {
                if(func !== undefined) _listeners = _listeners[prop];

                for(var x=0,len=_listeners.length;x<len;x++)
                {
                    if(_listeners[x].toString() === func.toString())
                    {
                        _listeners.splice(x,1);
                        return this;
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

        function setDescriptor(value,writable)
        {
            return {
                value:value,
                writable:!!writable,
                enumerable:false,
                configurable:false
            }
        }

        function setBindDescriptor(value,index)
        {
            var _value = value,
                _oldValue = value,
                _prop = index,
                _set = _onset,
                _update = _onupdate;
            return {
                get:function(){
                    return _value;
                },
                set:function(v,stopChange)
                {
                    if(_set(this,_prop,'set',v,_value) !== true)
                    {
                        _oldValue = _value;
                        _value = v;
                        _update(this,_prop,'update',_value,_oldValue);
                        if(!stopChange) this.callSubscribers(_prop,_value,_oldValue);
                    }
                },
                configurable:true,
                enumerable:true
            }
        }

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

        Object.defineProperties(_obj,{
            __kbname:setDescriptor((name || ""),true),
            __kbref:setDescriptor((parent ? (parent.__kbref || parent) : _obj),true),
            __kbscopeString:setDescriptor((scope || ""),true),
            __kbImmediateParent:setDescriptor((parent || null),true),
            add:setDescriptor(add),
            addPointer:setDescriptor(addPointer),
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
