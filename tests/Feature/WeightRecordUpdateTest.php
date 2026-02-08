<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WeightRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeightRecordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_their_own_weight_record(): void
    {
        $user = User::factory()->create();
        $record = WeightRecord::factory()->create([
            'user_id' => $user->id,
            'date' => '2026-02-01',
            'time' => '10:00:00',
            'weight_kg' => 80.0,
        ]);

        $response = $this->actingAs($user)->put(route('weight-records.update', $record), [
            'date' => '2026-02-02',
            'time' => '11:00',
            'weight_kg' => 81.5,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('weight_records', [
            'id' => $record->id,
            'user_id' => $user->id,
            'date' => '2026-02-02 00:00:00',
            'time' => '11:00',
            'weight_kg' => 81.50,
        ]);
    }

    public function test_user_cannot_update_others_weight_record(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $record = WeightRecord::factory()->create([
            'user_id' => $otherUser->id,
            'weight_kg' => 80.0,
        ]);

        $response = $this->actingAs($user)->put(route('weight-records.update', $record), [
            'date' => '2026-02-02',
            'time' => '11:00',
            'weight_kg' => 81.5,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('weight_records', [
            'id' => $record->id,
            'weight_kg' => 80.0,
        ]);
    }

    public function test_update_validation_rules(): void
    {
        $user = User::factory()->create();
        $record = WeightRecord::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->put(route('weight-records.update', $record), []);

        $response->assertSessionHasErrors(['date', 'time', 'weight_kg']);
    }
}
