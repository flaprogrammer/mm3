var DangerImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAQCAYAAAGHNqTJAAAACXBIWXMAAA7DAAAOwwHHb6hkAAACo0lEQVR4nIVTTUgVURT+7n2jps9yZp6WpmZpVphiGC0SKigwQVq0SZCkVS0MXFhRQQt3LgItoiQLDMldIWhWSIhQixbRU8envWwRZfr8eb4Rez+KM7c71/H5Jow+OHPvPffMOd/57r0EHN0qYYSxOrQrrqHAnWusXaGMNAO0WCWGdFQhhlp0AMSK9e1OY+knTiOl+CBeP2xddz7g8bBh8Bmxsy7yQbHmrk6VzlQ1NGXl7cqB/HUCUiZj2dbOwtwsflm/3FelasrMNxt5yMZkoHwvO/x7CaYeQnwzNQ2DkSikDhlHKsrKvVHfKFwNTTBCi0hWVAQG+rH8zY8Vnppe0THsHdPw3Sap86CRt33IrqoRvhVeLF6uVaZdEaA+3pDNJRVYjAd1q7jO3XfhRFB8uzy0ZeHqJfbTA4cF6s4xdMqQJ2prmMY1t6TWPFSMMzcbhY88z003CqJhamUq5h0x0wQhBJPtbSI7dXPTOTvdZkgoxYz3E4ycXOGjU5HIE91q02b17lEbMktKceh8rfCJLu7J1HARUGwBSYikm0luHhT7azMl8WwsNPOS+xX6LLewsL7iwkUk7cjYKqmAEQljvK8H/tHPm2J2qqh2u7f3V545S6P9PTzK+GeCDZBtqfgQi60zearQjqKS0svqUgir01MiIJ9LZyEy6cfq/CzkypNizUwDC696EJv6IdYjXDHpsUKGikrLThlffJhLqJ5vj2n8sltmYfr9IILasLMtSzQDrNE/pnlVMOoQKAGBcQ1rnHYef0FZx44jPD8PrfeF2FvjzUgNIYy2yaYnQOhEClh24vkEeWsfe1/C5AwV/o6SPZnYWbAPcv6e+FlbTBzFWzNoCyO4Zf5X0k24uDkuRtOSeXtZN12M4QZfhrb+zYGgSUjdHytwCP1xLDmyAAAAAElFTkSuQmCC';
var SuspiciousImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAQCAYAAAGHNqTJAAAACXBIWXMAAA7DAAAOwwHHb6hkAAACtElEQVR4nIVTz08TQRT+drcL0qUU2P4GjbIFGoNBsQlH4k3/BROOnog9iAdCL9w49MSBi5LQeODAwXioChoDiQejHFCBUKSWSoV2S3/Qpt020h/ObKHQAPolkzfz5nvvzftmhgGBz+erMAzzkPF4PMvBYHBIkiQwExMTrNPpLLF2yVIKBNbBUO67hbnKl5VN7O3HMTg4CA11bmzuQdfSCgcZfr+/yiRZk8S00Tnn9XojS0tLxvThAa516sBquIKF7jQ2NiKRzIFd3wg9cDjsEJp1qkPNQbG46KsITUcoFv+cuMByHKJyGcz09PTt3m7baiaTwvsPKxCEK8jlCrjVJ8Fibkc0VgA7MjLy9dvatpqWgud5dN3oxNr6T9UXj8dPy7lcrhdms2mYIyVOUC6XEY3KyRqJ9PaUGA/qkVDVmJ+fn5S6jGNyNFS32y7aRG52drbVLll90UgIL199JOewqXbrRxgWUzM05XIpsb/3qxble/MJDCl8b2gA+fwRNBquzCr5Yo1QqVTQ0WEieqTQ0iKA3Q3LzymTDoqBOzchywnSbkD1qV243eMlk0lkcQE0VZEa+HA4UjIYxLrNVOrwVCwK+k76+/u9er12WOq6qqp7GYqlIsK7EcQO0qdizs3N3ed57nWP3cbG47/Vhv4HluUQkYvVk8zMzDyzWtsf8XwRhbyiEt4ufFat1SpCT1Txb+0eBzJw3u2FKOrVtRwjkk5NTS2bTfqhXDZ5YfVIJKEOim77VSK3UZ2fKKwoCjTZbNa16Q+uGgwCyzDMuSQURmMbvUBsB8LYCe1Dq22Cw3G9loR1u93fFSUv7uzI0XRawdl7FIQm9PX1wGIxkUAtdDqBfIoSMplsjUeT1JUeHR2dbGjgx0SxDZed6iyqT/0A55j0mmOx2BOizziOv/U/kCDFHv8FtZovvL2puagAAAAASUVORK5CYII=';
var GoodImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAQCAYAAAGHNqTJAAAACXBIWXMAAA7DAAAOwwHHb6hkAAACr0lEQVR4nH1TS0xTQRQ9M320r7U/CoGilCCIWB4KXcjChV24wS1xRcLSpS6MJsQVK0ggoC7c6Mboho3iJ6CJG6KJ0RWihj/StCnFSin2S9v33jjv9QME8SSTO3Pn3M/ce4eA4/6MxBhBPxl9Ic3KedUvGAnI0BCos0dShPa+80o6wUA07suVyyy0sYtkvACThYBqyt2dMByuFBpbc8jvlZjc6w4X1dqejr+WIpmEWq0ZeFqtoCebqVu7qTKqyOcyoIEl9apmb3VkUciliz40PPvUy1wNBAU1WVbBQESsLkQgjE5J3V0XOuf+5FYx/yULo4lwdwzuJiOszgxUuZTNw/de5qhhCK4QWKyAxc6wvUnQdJYh/JPuhxue9D6ta0wPGAysEk5VCX6FTuxUSA9mOm8zsDEcRkwnTLyRRvw9/YOh1NtDt3XiJZB7U91OX5c/Hit8xvJcAu0+uy4pJWjrskEwmoVYdO9jxWrla0KXLZ0iFKUAwe4iVJELFQLjeTpqKNKJPEStI5vB1GONUCZpT0zuqogEFF2nJzn6/JzibspT/AO6MvN9qSoaFlD2VF6xLcN+sTRoc+K4KD2pqzk94Gvrg0mw/cupjoKSxWLwHQLh+f1iTkxLvWKVddonXaFbmQ9gUI91UIaBmLC+GC1mMv7K+6jZI10X7Rlk5WipbGld2qoFiGaK35t5/Uy4xakWERabQT8HljMQxqak2TMtXn+OriO1dzR6Mi7zVdzXNhh4uTVjldejyGVc8EqRm2sbC3NuDyghR3wUs3Hy6nLb7YiCeFSBUQTqPUWyyp3QO9d+fKOKsSa0hq1sSsbBPprMjP8wGc5amT9J4c1mfCKALH9pmadlcij28GTHiMmsDLrqczguq4PQRz0o4ghVa7OxveMWH/u7KH3r/yDGGLvxF30tKs+p7Df9AAAAAElFTkSuQmCC';
