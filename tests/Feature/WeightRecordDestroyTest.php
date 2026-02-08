<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WeightRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeightRecordDestroyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_delete_their_weight_record(): void
    {
        $user = User::factory()->create();
        $record = WeightRecord::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->delete(route('weight-records.destroy', $record));

        $response->assertRedirect();
        $this->assertDatabaseMissing('weight_records', [
            'id' => $record->id,
        ]);
    }

    public function test_user_cannot_delete_others_weight_record(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $record = WeightRecord::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($user)->delete(route('weight-records.destroy', $record));

        $response->assertForbidden();
        $this->assertDatabaseHas('weight_records', [
            'id' => $record->id,
        ]);
    }
}
