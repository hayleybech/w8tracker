<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WeightRecord>
 */
class WeightRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'date' => $this->faker->date(),
            'time' => $this->faker->time(),
            'weight_kg' => $this->faker->randomFloat(2, 50, 150),
        ];
    }
}
