import * as React from 'react'
import { ONE_REACT_MOMENTS, OneBookmark, OneButton, OneMoment, OneProvider, OneSwitch, useOneSpring, useOneTheme } from '@one-ui/react'

function Example() {
  const [level, change] = React.useState(4)
  const position: number = useOneSpring(level, 'detent')
  const { updateTheme } = useOneTheme()
  return <OneProvider theme="system" density="compact">
    <OneButton ref={React.createRef<HTMLButtonElement>()} onClick={event => event.currentTarget.focus()}>Save</OneButton>
    <OneSwitch label="Reduce motion" onCheckedChange={on => updateTheme({ motion: on ? 'reduced' : 'calm' })} />
    <OneMoment name="detent-dial" value={level} onValueChange={change} />
    <ONE_REACT_MOMENTS.odometer value={Math.round(position)} />
    <OneBookmark onPressedChange={on => change(Number(on))} />
  </OneProvider>
}
void Example
// @ts-expect-error Range controls require numeric values
const badRange = <OneMoment name="detent-dial" value="5" />
// @ts-expect-error The slug determines the props
const badSwitch = <OneMoment name="ink-switch" pressed />
// @ts-expect-error Unknown catalog entry
const badName = <OneMoment name="fly-away" />
// @ts-expect-error The registry preserves the concrete prop type
const badValue = <ONE_REACT_MOMENTS.odometer value="one" />
