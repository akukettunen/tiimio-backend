const baseball = () => {
  return {
    tags: [
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
        name: 'Pelaajat',
        tags: [
          'Maija Meikäläinen',
          'Matti Meikäläinen'
        ]
      },
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
        name: 'Palot',
        tags: [
          '0',
          '1',
          '2'
        ]
      },
      {
        name: 'Lyönnin tyyppi',
        tags: [
          'Vaakamaila',
          'Kumura',
          'Näppi',
          'Pussari',
          'Varsi',
          'Kopinnosto',
          'Viisto / Pyke',
          'Pomppu',
          'Muu'
        ]
      },
      {
        name: 'Tulos',
        tags: [
          'Palo',
          'Haava',
          'Kärkilyönti',
          'Takapalo',
          'Vapaa',
          'Haava kärjen takana'
        ]
      },
      {
        name: 'Merkattu',
        tags: [
          'Kyllä',
          'Ei'
        ]
      },
      {
        name: 'Lyönnin numero',
        tags: [
          '1',
          '2',
          '3'
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
    ],
    timenames: [
      "Start",
      "End"
    ]
  }
}

module.exports = { pesapallo, baseball, other }