import { CollisionCategories } from "../lib";

const { categoryBoot, categoryPlayer, categoryFootball, categoryPlatform } =
    CollisionCategories;

export class Ball extends Phaser.Physics.Matter.Image {
    #VELOCITY_MODIFIER: Phaser.Types.Math.Vector2Like;
    constructor(
        world: Phaser.Physics.Matter.World,
        x: number,
        y: number,
        ballOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig
    ) {
        super(world, x, y, "football");
        this.#VELOCITY_MODIFIER = { x: 0, y: 0 };
        this.scene.add.existing(this);
        this.setCircle(10, { ...ballOptions, label: "football" });
        this.setMass(3);
        this.setBounce(1);
        this.setFriction(0.05, 0.005);
        this.setCollisionCategory(categoryFootball);
        this.setCollidesWith(categoryBoot | categoryPlayer | categoryPlatform);

        // this.setOnCollide(
        //     ({
        //         bodyA: { label: labelA },
        //         bodyB: { label: labelB },
        //     }: Phaser.Types.Physics.Matter.MatterCollisionData) => {
        //         // Kicked
        //         if (
        //             cursors.C.isDown &&
        //             (labelA == 'boot-1' || labelB == 'boot-1')
        //         ) {
        //             this.setVelocity(
        //                 this.getVelocity().x + 5,
        //                 this.getVelocity().y + -8,
        //             );
        //             this.setAngularVelocity(this.getAngularVelocity() + 0.5);
        //         } else if (
        //             cursors.space.isDown &&
        //             (labelA == 'boot-2' || labelB == 'boot-2')
        //         ) {
        //             if (cursors.space.isDown) {
        //                 this.setVelocity(
        //                     this.getVelocity().x + -5,
        //                     this.getVelocity().y + -8,
        //                 );
        //                 this.setAngularVelocity(
        //                     this.getAngularVelocity() + 0.5,
        //                 );
        //             }
        //         }
        //         // Collides with player
        //         if (
        //             (cursors.up.isDown ||
        //                 cursors.right.isDown ||
        //                 cursors.left.isDown ||
        //                 cursors.W.isDown ||
        //                 cursors.A.isDown ||
        //                 cursors.D.isDown) &&
        //             (labelA == 'player-1' ||
        //                 labelB == 'player-1' ||
        //                 labelA == 'player-2' ||
        //                 labelB == 'player-2')
        //         ) {
        //             const newVelocity = this.scene.matter.vector.add(
        //                 this.getVelocity(),
        //                 this.#VELOCITY_MODIFIER,
        //             );
        //             this.setVelocity(newVelocity.x, newVelocity.y);
        //         }
        //     },
        // );
    }

    setVelocityModifier(vector: Phaser.Types.Math.Vector2Like) {
        this.#VELOCITY_MODIFIER = vector;
    }
    getVelocityModifier() {
        return this.#VELOCITY_MODIFIER;
    }
}
