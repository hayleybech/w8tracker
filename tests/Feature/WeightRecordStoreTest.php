<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeightRecordStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_add_weight_record(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('weight-records.store'), [
            'date' => '2026-02-08',
            'time' => '21:40',
            'weight_kg' => 85.5,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('weight_records', [
            'user_id' => $user->id,
            'date' => '2026-02-08 00:00:00',
            'weight_kg' => 85.50,
        ]);
    }

    public function test_weight_record_requires_validation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('weight-records.store'), []);

        $response->assertSessionHasErrors(['date', 'time', 'weight_kg']);
    }
}
