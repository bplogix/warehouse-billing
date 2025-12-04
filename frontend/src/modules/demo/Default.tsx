import { Avatar } from '@/components/ui/display/avatar'
import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import { Carousel } from '@/components/ui/display/carousel'
import { Separator } from '@/components/ui/display/separator'
import { Alert } from '@/components/ui/feedback/alert'
import { Progress } from '@/components/ui/feedback/progress'
import { Skeleton } from '@/components/ui/feedback/skeleton'
import { Button } from '@/components/ui/form-controls/button'
import { AspectRatio } from '@radix-ui/react-aspect-ratio'
import { toast } from 'sonner'

const DemoPage = () => {
  const show = () => {
    toast('Event has been created', {
      description: 'Sunday, December 03, 2023 at 9:00 AM',
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo'),
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <Button variant="secondary">Button</Button>
        <Button onClick={() => show()}>123</Button>
        <Button color="primary">123</Button>
        <Button>123</Button>

        <Badge>123</Badge>
        <Avatar>abc</Avatar>
        <Carousel>123</Carousel>
        <Separator>123</Separator>
      </Card>
      <Card>
        <AspectRatio>aaaaaaaa</AspectRatio>
        <Alert>123</Alert>
        <Progress>123</Progress>
        <Skeleton>111</Skeleton>
      </Card>
    </div>
  )
}

export default DemoPage
