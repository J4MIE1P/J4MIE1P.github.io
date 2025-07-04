// Smooth scrolling and active nav link handling
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Handle click events on navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Dragon Game Logic
const dragon = [];
let isDying = false;
const mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const foods = [];
const obstacles = [];
const maxFoods = 10;
const maxObstacles = 8;
const maxDragonLength = 30;
const foodLifetime = 8000; // 8 seconds
const obstacleLifetime = 12000; // 12 seconds
const expirationWarningTime = 1000; // 1 second warning before expiration
const minSpawnDistance = 20; // Minimum distance from dragon for spawning obstacles

// Create initial dragon segments (just 2)
function createSegment(index) {
    const segment = document.createElement('div');
    segment.className = `dragon-segment ${index === 0 ? 'dragon-head' : 'dragon-body'}`;
    
    if (index > 0) {
        const size = Math.max(26 - index * 1.5, 10);
        segment.style.width = `${size}px`;
        segment.style.height = `${size}px`;
    }
    
    document.body.appendChild(segment);
    return {
        element: segment,
        x: mousePos.x,
        y: mousePos.y,
        index: index
    };
}

// Initialize dragon with 2 segments
for (let i = 0; i < 2; i++) {
    dragon.push(createSegment(i));
}

// Get size of dragon segment
function getSegmentSize(index) {
    return index === 0 ? 30 : Math.max(26 - index * 1.5, 10);
}

// Add new segment to dragon
function addDragonSegment() {
    if (dragon.length >= maxDragonLength) return;
    
    const newIndex = dragon.length;
    const lastSegment = dragon[dragon.length - 1];
    const newSegment = createSegment(newIndex);
    
    // Position new segment at the last segment's position
    newSegment.x = lastSegment.x;
    newSegment.y = lastSegment.y;
    
    // Add pop animation
    newSegment.element.classList.add('new-segment');
    setTimeout(() => {
        newSegment.element.classList.remove('new-segment');
    }, 300);
    
    dragon.push(newSegment);
}

// Remove all segments except the first 2 when hit obstacle
function resetDragon() {
    while (dragon.length > 2) {
        const segment = dragon.pop();
        segment.element.remove();
    }
}

// Mouse tracking
document.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

// Create particle explosion
function createExplosion(x, y) {
    const particleCount = 20;
    const colors = ['#ff6b6b', '#ff4757', '#ee5a6f', '#ff3838', '#ff6348'];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = 4 + Math.random() * 8;
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x - size / 2}px`;
        particle.style.top = `${y - size / 2}px`;
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 ${size}px ${colors[Math.floor(Math.random() * colors.length)]}`;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    }

    // Create flash effect
    const flash = document.createElement('div');
    flash.className = 'death-flash';
    flash.style.setProperty('--x', `${x}px`);
    flash.style.setProperty('--y', `${y}px`);
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
}

// Death animation
function triggerDeathAnimation(hitSegment) {
    if (isDying) return;
    isDying = true;

    // Add dying class to all segments
    dragon.forEach(segment => {
        segment.element.classList.add('dragon-dying');
    });

    // Create explosion at the segment that was hit
    createExplosion(hitSegment.x, hitSegment.y);

    // Reset dragon after animation
    setTimeout(() => {
        dragon.forEach(segment => {
            segment.element.classList.remove('dragon-dying');
        });
        resetDragon();
        isDying = false;
    }, 500);
}

// Create food particle
function createFood() {
    if (foods.length >= maxFoods) return;

    const food = document.createElement('div');
    const foodType = Math.floor(Math.random() * 3) + 1;
    food.className = `food food-type-${foodType}`;
    
    const x = Math.random() * (window.innerWidth - 20);
    const y = Math.random() * (window.innerHeight - 20);
    
    food.style.left = `${x}px`;
    food.style.top = `${y}px`;
    
    document.body.appendChild(food);
    const foodItem = { element: food, x, y, createdAt: Date.now() };
    foods.push(foodItem);

    // Set expiration timer
    setTimeout(() => {
        if (foods.includes(foodItem)) {
            food.classList.add('food-expiring');
        }
    }, foodLifetime - expirationWarningTime);

    setTimeout(() => {
        const index = foods.indexOf(foodItem);
        if (index > -1) {
            food.remove();
            foods.splice(index, 1);
        }
    }, foodLifetime);
}

// Check if position is safe for spawning (not near dragon)
function isSafeSpawnPosition(x, y, size) {
    for (let segment of dragon) {
        const segmentSize = getSegmentSize(segment.index);
        const distance = Math.sqrt((x - segment.x) ** 2 + (y - segment.y) ** 2);
        if (distance < minSpawnDistance + (size + segmentSize) / 2) {
            return false;
        }
    }
    return true;
}

// Create obstacle
function createObstacle() {
    if (obstacles.length >= maxObstacles) return;

    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    
    const size = 30 + Math.random() * 30;
    obstacle.style.width = `${size}px`;
    obstacle.style.height = `${size}px`;
    
    // Try to find a safe spawn position
    let x, y;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
        x = Math.random() * (window.innerWidth - size);
        y = Math.random() * (window.innerHeight - size);
        attempts++;
    } while (!isSafeSpawnPosition(x + size/2, y + size/2, size) && attempts < maxAttempts);
    
    // If we couldn't find a safe position after many attempts, don't spawn
    if (attempts >= maxAttempts) {
        obstacle.remove();
        return;
    }
    
    obstacle.style.left = `${x}px`;
    obstacle.style.top = `${y}px`;
    
    document.body.appendChild(obstacle);
    const obstacleItem = { element: obstacle, x, y, size, createdAt: Date.now() };
    obstacles.push(obstacleItem);

    // Set expiration timer
    setTimeout(() => {
        if (obstacles.includes(obstacleItem)) {
            obstacle.classList.add('obstacle-expiring');
        }
    }, obstacleLifetime - expirationWarningTime);

    setTimeout(() => {
        const index = obstacles.indexOf(obstacleItem);
        if (index > -1) {
            obstacle.remove();
            obstacles.splice(index, 1);
        }
    }, obstacleLifetime);
}

// Check collision
function checkCollision(x1, y1, size1, x2, y2, size2) {
    const distance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    return distance < (size1 + size2) / 2;
}

// Animation loop
function animate() {
    if (!isDying) {
        // Update dragon head position
        const head = dragon[0];
        const headSpeed = 0.15;
        head.x += (mousePos.x - head.x) * headSpeed;
        head.y += (mousePos.y - head.y) * headSpeed;

        // Update dragon body
        for (let i = 1; i < dragon.length; i++) {
            const segment = dragon[i];
            const prevSegment = dragon[i - 1];
            const speed = 0.2 - Math.min(i * 0.005, 0.1);
            
            segment.x += (prevSegment.x - segment.x) * speed;
            segment.y += (prevSegment.y - segment.y) * speed;
        }

        // Apply positions
        dragon.forEach((segment, i) => {
            const size = getSegmentSize(i);
            segment.element.style.left = `${segment.x - size / 2}px`;
            segment.element.style.top = `${segment.y - size / 2}px`;
        });

        // Check food collisions (only with head)
        const headSize = 30;
        foods.forEach((food, index) => {
            if (checkCollision(head.x, head.y, headSize, food.x + 10, food.y + 10, 20)) {
                food.element.remove();
                foods.splice(index, 1);
                addDragonSegment();
            }
        });

        // Check obstacle collisions with ALL dragon segments
        obstacles.forEach((obstacle) => {
            for (let segment of dragon) {
                const segmentSize = getSegmentSize(segment.index);
                if (checkCollision(segment.x, segment.y, segmentSize, 
                    obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2, obstacle.size)) {
                    if (dragon.length > 2) {
                        triggerDeathAnimation(segment);
                        obstacle.element.classList.add('obstacle-hit');
                        setTimeout(() => {
                            obstacle.element.classList.remove('obstacle-hit');
                        }, 500);
                        break; // Exit the loop once we've detected a collision
                    }
                }
            }
        });
    }

    requestAnimationFrame(animate);
}

// Spawn items randomly
setInterval(createFood, Math.floor(Math.random() * 500) + 250);
setInterval(createObstacle, Math.floor(Math.random() * 1000) + 1000);

// Initial spawn
for (let i = 0; i < 5; i++) createFood();
for (let i = 0; i < 3; i++) createObstacle();

// Start animation
animate();

// Clean up items that go off screen on resize
window.addEventListener('resize', () => {
    foods.forEach((food, index) => {
        if (food.x > window.innerWidth || food.y > window.innerHeight) {
            food.element.remove();
            foods.splice(index, 1);
        }
    });
    
    obstacles.forEach((obstacle, index) => {
        if (obstacle.x > window.innerWidth || obstacle.y > window.innerHeight) {
            obstacle.element.remove();
            obstacles.splice(index, 1);
        }
    });
});