import { Title, Text, Container} from '@mantine/core'
import { IconPlant2 } from '@tabler/icons-react'
import { useEffect } from 'react'
import Router from 'next/router'
import { useUser } from '../../lib/hooks'
import { IconCardGrid } from '../../components/icon_card_grid'
import classes from '/styles/card.module.css'

export default function PlantLanding() {
  const [user, { loading }] = useUser()

  useEffect(() => {
    // redirect user to login if not authenticated
    if (!loading && !user) Router.replace('/')
  }, [user, loading])


  const cards = [
    {
      icon: IconPlant2,
      title: 'Plant Species',
      href: '/plants/species',
      description: 'Species of the plants used in the locations and information about them'
    },
    {
      icon: IconPlant2,
      title: 'Plant Observations',
      href: '/plants/observe',
      description: 'Plants observed at locations'
    }
  ]

  return (
    <>
      <Container maw='85%' my="5rem">
        <Title order={2} className={classes.title} ta="center" mt="sm">Urban River Plants Resources</Title>
        <Text c="dimmed" className={classes.description} ta="center" mt="md">
          Collecting and sharing data about Urban River's projects.
        </Text>
        <IconCardGrid cards={cards} />
      </Container>
    </>
  )
}