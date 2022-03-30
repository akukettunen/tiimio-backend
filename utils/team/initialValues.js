const baseball = () => {
  return {
    groups: [
      {
        name: 'Base', 
        tags: [
          '1st',
          '2nd',
          '3rd'
        ]
      },
      {
        name: 'Player', 
        tags: [
          'Jane Doe',
          'John Doe'
        ]
      },
      {
        name: 'Opposing team', 
        tags: [
          'New York Yankees'
        ]
      },
      {
        name: 'Events', 
        tags: [
          'Hit',
          'Catch',
          'Pitch'
        ]
      }
    ],
    timenames: [
      'Pitch made', 
      'Ball at catcher', 
      'Exchange',
      'Pop time',
      'Runner takeoff',
      'Runner at base'
    ]
  }
}

const pesapallo = () => {
  return {
    tags: [
      {
        name: 'Pesänväli',
        tags: [
          'K-1',
          '1-2',
          '2-3',
          '3-K'
        ]
      },
      {
        name: 'Pelaajat',
        tags: [
          'Maija Meikäläinen',
          'Matti Meikäläinen'
        ]
      }
    ],
    timenames: [
      'Syöttö nousee',
      'Etenijä lähtee',
      'Etenijä pesässä'
    ]
  }
}

const other = () => {
  return {
    tags: [
      {
        name: 'Players',
        tags: [
          'John Doe',
          'Jane Doe'
        ]
      },
      {
        name: 'Event',
        tags: [
          'Attack', 
          'Defense'
        ]
      }
    ]
  }
}

module.exports = { pesapallo, baseball }