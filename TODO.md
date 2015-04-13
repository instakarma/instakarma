
- Figure out identification
    - mongo id, only internals
    - email, should probably not be world-readable
    - id, can be visible, but is not very human readable
    - id should be renamed to avoid confusion maybe. uid?
    - What should the "dao" be working with?

- Figure out befriending.
    - How to find person.
    - How to do friend requests.
    - Move out friend.populate from the call that is done for every personalized page.

- Finding friend / someone to give karma by proximity. Should do geolocation, show all others that hit the "find friend" key within n mins and x radius 

- Method for getting a union of friends and people transacted with recently

