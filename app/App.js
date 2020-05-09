import React, { Component } from 'react';
import { StyleSheet, View, NativeModules, Text, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import Animated, { block } from 'react-native-reanimated';

const { UIManager } = NativeModules;

const {width, height} = Dimensions.get('window');

const {
  or,
  event,
  Value,
  Clock,
  lessThan,
  greaterThan,
  divide,
  diff,
  abs,
  startClock,
  stopClock,
  cond,
  add,
  multiply,
  eq,
  set,
  sub,
  min,
  max,
  debug,
  and,
  lessOrEq,
  greaterOrEq
} = Animated;

const VELOCITY_THRESHOLD = 0.5;
const POSITION_THRESHOLD = 0.5;
const VELOCITY = width/2;
const paddleWidth = width/4;
const paddleHeight = height*0.04;
const blockWidth = 0.2*width;
const blockHeight = 0.05*height;

class App extends Component {
  blocks = [
    {top: 0.88*height, width: paddleWidth, height: paddleHeight},
    {top: 0.225*height, left: 0, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.225*height, left: (width - blockWidth)/3, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.225*height, left: 2*(width - blockWidth)/3, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.225*height, left: (width - blockWidth), backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.725*height, left: 0, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.725*height, left: (width - blockWidth)/3, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.725*height, left: 2*(width - blockWidth)/3, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.725*height, left: (width - blockWidth), backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.625*height, left: 0, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.625*height, left: (width - blockWidth)/3, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.625*height, left: 2*(width - blockWidth)/3, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.625*height, left: (width - blockWidth), backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.325*height, left: 0, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.325*height, left: (width - blockWidth)/3, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.325*height, left: 2*(width - blockWidth)/3, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.325*height, left: (width - blockWidth), backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.425*height, left: 0, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.425*height, left: (width - blockWidth)/3, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.425*height, left: 2*(width - blockWidth)/3, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.425*height, left: (width - blockWidth), backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.525*height, left: 0, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.525*height, left: (width - blockWidth)/3, backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.525*height, left: 2*(width - blockWidth)/3, backgroundColor: 'blue', width: blockWidth, height: blockHeight},
    {top: 0.525*height, left: (width - blockWidth), backgroundColor: 'red', width: blockWidth, height: blockHeight},
    {top: 0.08*height, width: paddleWidth, height: paddleHeight}
  ];
  constructor(props) {
    super(props);

    const gestureX = new Value(0);
    const state = new Value(-1);
    this._onGestureEvent = event([
      {
        nativeEvent: {
          x: gestureX,
          state: state,
        },
      },
    ]);
    const myX = new Value(width/2 - paddleWidth/2);
    const notMyX = new Value(50);
    const movePaddle = (gestureX, gestureState) => {
      const position = new Value(width/2 - paddleWidth/2);
      const velocity = new Value(0);
      const dest = new Value(0);
      
      const clock = new Clock();
      const dt = divide(diff(clock), 1000);
      const dp = multiply(velocity, dt);

      const move = (position, dest, velocity) => set(
        velocity,
        cond(
          lessThan(position, dest),
          VELOCITY,
          cond(greaterThan(position, dest), -VELOCITY, 0)
        )
      )

      return cond(
        or(eq(gestureState, State.ACTIVE), eq(gestureState, State.BEGAN)),
        [
          startClock(clock),
          set(dest, add(gestureX, -paddleWidth/2)),
          set(dest, max(dest, 0)),
          set(dest, min(dest, width-paddleWidth)),
          move(position, dest, velocity),
          cond(lessThan(abs(sub(position, dest)), VELOCITY_THRESHOLD), stopClock(clock)),
          set(position, add(position, cond(lessThan(abs(dp), abs(sub(dest, position))), dp, sub(dest, position)))),
          set(myX, position),
          position
        ],
        [
          startClock(clock),
          dt,
          position
        ]
      )
    }
    let ballVelocity = {
      x: new Value(width/1.2),
      y: new Value(width/1.2)
    }
    let ball = {
      x: new Value(width/2 - 0.015*width),
      y: new Value(height/2 - 0.015*width)
    }
    const moveBallX = (velocity) => {
      const clock = new Clock();
      const dt = divide(diff(clock), 1000);
      const dp = multiply(velocity.x, dt);
      const truly = new Value(1);
      return cond(truly, [
        startClock(clock),
        cond(
          and(greaterThan(add(ball.x, 0.03*width), width), greaterThan(velocity.x, 0)), 
          set(velocity.x, multiply(velocity.x, -1)),
          cond(and(lessThan(ball.x, 0), lessThan(velocity.x, 0)), set(velocity.x, multiply(velocity.x, -1)))
        ),
        this.blocks.map((elem, idx) => {
          if(idx === 0) elem.left = myX;
          if(idx == this.blocks.length-1) elem.left = notMyX;
          return cond(
            and(greaterOrEq(ball.y, elem.top), lessOrEq(add(ball.y, 0.03*width), elem.top + elem.height)),
            cond(
              and(lessOrEq(ball.x, elem.left), greaterOrEq(add(ball.x, 0.03*width), elem.left), greaterThan(velocity.x, 0)),
              set(velocity.x, multiply(velocity.x, -1)),
              cond(
                and(lessOrEq(ball.x, add(elem.left, elem.width)), greaterOrEq(add(ball.x, 0.03*width), add(elem.left, elem.width)), lessThan(velocity.x, 0)),
                set(velocity.x, multiply(velocity.x, -1)),
                0
              )
            ),
            []
          );
        }),
        set(ball.x, add(ball.x, dp)),
        ball.x
      ])
    };
    const moveBallY = (velocity) => {
      const clock = new Clock();
      const dt = divide(diff(clock), 1000);
      const dp = multiply(velocity.y, dt);
      const truly = new Value(1);
      return cond(truly, [
        startClock(clock),
        cond(
          and(greaterThan(add(ball.y, 0.03*width), height), greaterThan(velocity.y, 0)), 
          set(velocity.y, multiply(velocity.y, -1)),
          cond(and(lessThan(ball.y, 0), lessThan(velocity.y, 0)), set(velocity.y, multiply(velocity.y, -1)))
        ),
        cond(
          and(lessThan(ball.x, this.myPaddleX), lessThan(velocity.x, 0)),
          set(velocity.x, multiply(velocity.x, -1)),
        ),
        this.blocks.map((elem, idx) => {
          //if(idx === 0 || idx == this.blocks.length-1) return [];
          if(idx === 0) elem.left = myX;
          if(idx == this.blocks.length-1) elem.left = notMyX;
          return cond(
            and(greaterOrEq(ball.x, elem.left), lessOrEq(add(ball.x, 0.03*width), add(elem.left, elem.width))),
            cond(
              and(lessOrEq(ball.y, elem.top), greaterOrEq(add(ball.y, 0.03*width), elem.top), greaterThan(velocity.y, 0)),
              set(velocity.y, multiply(velocity.y, -1)),
              cond(
                and(lessOrEq(ball.y, elem.top + elem.height), greaterOrEq(add(ball.y, 0.03*width), elem.top+elem.height), lessThan(velocity.y, 0)),
                set(velocity.y, multiply(velocity.y, -1)),
                0
              )
            ),
            []
          );
        }),
        set(ball.y, add(ball.y, dp)),
        ball.y
      ])
    }
    this.ballPosX = moveBallX(ballVelocity);
    this.ballPosY = moveBallY(ballVelocity);
    this.myPaddleX = movePaddle(gestureX, state)
    this.blocks[0].left = this.myPaddleX;
  }
  render() {
    return (
      <View style={styles.container}>
        <PanGestureHandler
          onGestureEvent={this._onGestureEvent}
          onHandlerStateChange={this._onGestureEvent}
        >
          <Animated.View style={styles.hor}>
            {
              this.blocks.map((elem, idx) => (
                idx === 0 || idx == this.blocks.length-1
                ?
                  <View style={styles.paddleSpace} key={idx}>
                    <Animated.View 
                      style={[
                        styles.box,
                        {
                          transform: [{ translateX: (idx === 0 ? this.myPaddleX : 50) }],
                          backgroundColor: (idx === 0 ? '#FF4400' : '#0064FF')
                        }
                      ]}
                    />
                  </View>
                :
                  <View 
                    key={idx} 
                    style={[
                      styles.block,
                      elem
                    ]}
                  />
              ))
            }
            <Animated.View 
              style={[
                styles.ball,
                {
                  top: 0,
                  left: 0,
                  transform: [{translateX: this.ballPosX}, {translateY: this.ballPosY}]
                }
              ]}
            />
          </Animated.View>
        </PanGestureHandler>
      </View>
    )
  }
}

export default App;

const BOX_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  box: {
    width: paddleWidth,
    height: '20%',
    backgroundColor: 'teal',
    //margin: BOX_SIZE / 2,
  },
  block: {
    position: 'absolute',
    width: paddleWidth,
    height: paddleHeight,
    backgroundColor: 'black'
  },
  hor: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column-reverse'
  },
  paddleSpace: {
    width: '100%',
    height: '20%',
    justifyContent: 'center',
  },
  ball: {
    borderRadius: 2000,
    backgroundColor: 'black',
    position: 'absolute',
    width: '3%',
    aspectRatio: 1
  }
});
